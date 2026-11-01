import { useSyncExternalStore } from 'react';

import * as Hinge from 'expo-hinge';
import type { Hinge as HingeState } from 'expo-hinge';
import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addFoldListener, getFold, useFold, type Fold } from '../../modules/fold-features';
import { useAppSelector } from '../../redux/hooks';

// The shortest landscape iPhone window is well under this; the iPhone Duo's
// unfolded inner display is well over it.
const EXPANDED_MIN_HEIGHT = 600;

// Regular iPhones are about 2.2:1 in either orientation; both iPhone Duo
// displays are close to square (about 1.4-1.5:1).
const VERTICAL_BAR_MAX_ASPECT_RATIO = 1.7;

/**
 * Whether the system is likely showing navigation bar items in a vertical bar:
 * either iPhone Duo display. There is no public signal for vertical bars in
 * React Native, so this is inferred from the window shape.
 */
export const useVerticalBarLayout = (): boolean => {
    const { width, height } = useWindowDimensions();
    const longSide = Math.max(width, height);
    const shortSide = Math.min(width, height);

    return Platform.OS === 'ios'
        && !Platform.isPad
        && shortSide > 0
        && longSide / shortSide < VERTICAL_BAR_MAX_ASPECT_RATIO;
};

/**
 * Whether the game screen should use the expanded layout: the iPhone Duo's
 * inner display in landscape, where the system shows navigation bar items in
 * a vertical bar. There is no public signal for vertical bars in React Native,
 * so this is inferred from the window size.
 *
 * In this layout the round picker moves from the header into the bottom-right
 * half of the screen and the game sheet takes the bottom-left half, leaving
 * nothing in the header.
 */
export const useExpandedGameLayout = (): boolean => {
    const { width, height } = useWindowDimensions();

    return Platform.OS === 'ios'
        && !Platform.isPad
        && width > height
        && height >= EXPANDED_MIN_HEIGHT;
};

/**
 * Where the bottom strip splits between the game sheet (left) and the round
 * picker (right) in the expanded layout: the middle of the board, which sits
 * inside the safe area, not the middle of the window (the vertical bar takes
 * the right edge).
 */
export const useExpandedGameSplit = (): { sheetWidth: number; pickerWidth: number; pickerRight: number } => {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const half = (width - insets.left - insets.right) / 2;

    return {
        sheetWidth: insets.left + half,
        pickerWidth: half,
        pickerRight: insets.right,
    };
};

/**
 * The least space kept clear across the fold when the game screen splits
 * around it. On Android the fold's own width is used when it's wider.
 */
export const FOLD_GAP = 32;

/**
 * How the game screen splits across a partially open foldable (the iPhone Duo,
 * or an Android foldable like the Pixel Fold): the board on one half and the
 * game sheet, docked open, on the other (Apple's overlay arrangement). A fold
 * running top to bottom makes the halves columns; one running across makes
 * them rows. Null when the device is flat or closed, in fullscreen (which hides
 * the sheet), and on devices without a hinge.
 */
export type GameFoldSplit = 'columns' | 'rows';

// A quick outer-display-to-flat opening passes through `partiallyOpen`, but that
// transient state is not a useful destination for the layout. Only publish a
// fold split after the hinge has stopped moving for a short interval. Raw angle
// samples stay outside React, and an active split remains stable until the hinge
// leaves `partiallyOpen`.
const FOLD_SETTLE_DELAY_MS = 250;
// Hinge angle sensors jitter by a degree or so at rest; a smaller threshold
// would keep restarting the settle timer on a device sitting half open.
const MEANINGFUL_HINGE_ANGLE_DELTA = 3;
// Opening from the cover display, the hinge creeps through its last few
// degrees still reporting partially open, with samples arriving as rarely as
// every half second, so it looks settled before it reaches flat. Nobody holds
// a book that open, so past this angle a partially open hinge doesn't start
// book mode (it can still stay in it, until the hinge reports fully open).
const NEARLY_FLAT_HINGE_ANGLE = 160;

let foldSplitActive = false;
let nativeSubscriptions: { remove: () => void }[] | null = null;
// Android: whether the window manager reports the fold half open.
let androidFoldHalfOpen = false;
let foldSettleTimer: ReturnType<typeof setTimeout> | null = null;
let lastMotionAngle: number | null = null;
const foldSplitListeners = new Set<() => void>();

// Closing the iPhone Duo: the hinge reports closed a moment before the app
// moves to the cover display. Listeners get the chance to hold the layout
// still through the move (see GameScreen).
let lastHingeStatus: HingeState['status'] | null = null;
const hingeClosingListeners = new Set<() => void>();

/** Calls `listener` when the hinge starts reporting closed. iOS only. */
export const addHingeClosingListener = (listener: () => void): (() => void) => {
    hingeClosingListeners.add(listener);
    return () => hingeClosingListeners.delete(listener);
};

const publishFoldSplit = (active: boolean) => {

    if (active === foldSplitActive) return;

    foldSplitActive = active;
    foldSplitListeners.forEach(notify => notify());
};

const cancelPendingFoldSplit = () => {
    if (foldSettleTimer != null) clearTimeout(foldSettleTimer);
    foldSettleTimer = null;
    lastMotionAngle = null;
};

const restartFoldSettleTimer = () => {
    if (foldSettleTimer != null) clearTimeout(foldSettleTimer);
    foldSettleTimer = setTimeout(() => {
        foldSettleTimer = null;
        lastMotionAngle = null;
        publishFoldSplit(true);
    }, FOLD_SETTLE_DELAY_MS);
};

// Whether an angle sample is far enough from the last one that restarted the
// settle timer to count as the hinge still moving. Records it if so.
const hingeMoved = (angle: number): boolean => {
    if (lastMotionAngle != null && Math.abs(angle - lastMotionAngle) < MEANINGFUL_HINGE_ANGLE_DELTA) return false;
    lastMotionAngle = angle;
    return true;
};

const updateFoldSplitFromHinge = (hinge: HingeState | null) => {
    const status = hinge?.status ?? null;
    if (status === 'closed' && lastHingeStatus !== 'closed') {
        hingeClosingListeners.forEach(notify => notify());
    }
    lastHingeStatus = status;
    if (hinge?.status !== 'partiallyOpen') {
        cancelPendingFoldSplit();
        publishFoldSplit(false);
        return;
    }

    // Once book mode is visible, angle samples should not disturb it. Leaving
    // the partial status above dismisses it immediately.
    if (foldSplitActive) return;

    if (hinge.angle > NEARLY_FLAT_HINGE_ANGLE) {
        cancelPendingFoldSplit();
        return;
    }

    if (!hingeMoved(hinge.angle) && foldSettleTimer != null) return;
    restartFoldSettleTimer();
};

// On Android the window manager's fold state decides whether the device is half
// open: it's the same source the split's direction and position come from, so
// the three never disagree, and it works without a hinge angle sensor.
const updateFoldSplitFromFold = (fold: Fold | null) => {
    androidFoldHalfOpen = fold?.state === 'halfOpened';
    if (!androidFoldHalfOpen) {
        cancelPendingFoldSplit();
        publishFoldSplit(false);
        return;
    }
    if (foldSplitActive || foldSettleTimer != null) return;
    restartFoldSettleTimer();
};

// The window manager reports half open throughout a continuous opening, so where
// a hinge angle sensor exists its samples keep the settle delay running while
// the hinge is still moving. They never turn book mode on or off themselves.
const updateFoldMotionFromHinge = (hinge: HingeState | null) => {
    if (!androidFoldHalfOpen || foldSplitActive || hinge == null) return;
    if (hinge.angle > NEARLY_FLAT_HINGE_ANGLE) {
        cancelPendingFoldSplit();
        return;
    }
    if (hingeMoved(hinge.angle)) restartFoldSettleTimer();
};

const getFoldSplitSnapshot = (): boolean => foldSplitActive;

const subscribeToSettledFoldSplit = (listener: () => void): (() => void) => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return () => {};

    foldSplitListeners.add(listener);
    if (nativeSubscriptions == null) {
        if (Platform.OS === 'android') {
            nativeSubscriptions = [
                addFoldListener(({ fold }) => updateFoldSplitFromFold(fold)),
                Hinge.addHingeListener(({ hinge }) => updateFoldMotionFromHinge(hinge)),
            ];
            updateFoldSplitFromFold(getFold());
        } else {
            nativeSubscriptions = [Hinge.addHingeListener(({ hinge }) => updateFoldSplitFromHinge(hinge))];
            updateFoldSplitFromHinge(Hinge.getHinge());
        }
    }

    return () => {
        foldSplitListeners.delete(listener);
        if (foldSplitListeners.size === 0) {
            nativeSubscriptions?.forEach(subscription => subscription.remove());
            nativeSubscriptions = null;
            cancelPendingFoldSplit();
            foldSplitActive = false;
            androidFoldHalfOpen = false;
        }
    };
};

export const useGameFoldSplit = (): GameFoldSplit | null => {
    const settledFoldSplit = useSyncExternalStore(
        subscribeToSettledFoldSplit,
        getFoldSplitSnapshot,
        () => false
    );
    const { width, height } = useWindowDimensions();
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const fold = useFold();

    if (fullscreen || !settledFoldSplit) return null;

    // On Android the window manager also says which way the fold runs: a fold line
    // running top to bottom splits the window into columns. The shape of the
    // window doesn't tell: the Pixel Fold's inner screen is nearly square.
    if (Platform.OS === 'android') {
        if (fold == null) return null;
        return fold.orientation === 'vertical' ? 'columns' : 'rows';
    }

    // On the iPhone Duo the fold always crosses the long side.
    if (Platform.OS !== 'ios') return null;
    return width > height ? 'columns' : 'rows';
};

/**
 * Whether the game screen's round picker sits in the bottom strip beside the
 * game sheet instead of in the header. True in the expanded layout, except in
 * fullscreen, which hides the sheet and keeps the picker in the header. With
 * the picker out of the header, the header has no content and collapses.
 */
export const useRoundPickerInBottomStrip = (): boolean => {
    const expanded = useExpandedGameLayout();
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);

    return expanded && !fullscreen;
};

/**
 * Whether the round picker has moved out of the header into the game sheet:
 * beside it in the iPhone Duo's expanded layout, or inside it when it docks on
 * one side of the fold (see GameSheet).
 */
export const useRoundPickerOutOfHeader = (): boolean => {
    const inBottomStrip = useRoundPickerInBottomStrip();
    const foldSplit = useGameFoldSplit();

    return inBottomStrip || foldSplit === 'columns';
};

/**
 * Where the game screen splits around the fold, along the split's axis (x for
 * columns, y for rows), in window coordinates: the board ends at `boardEnd`
 * and the docked sheet starts at `sheetStart`. Android reports where the fold
 * is; iOS has no API for it yet, so the iPhone Duo's fold is assumed to run
 * through the middle of the window.
 */
export const useFoldSplitBounds = (foldSplit: GameFoldSplit | null): { boardEnd: number; sheetStart: number } => {
    const { width, height } = useWindowDimensions();
    const fold = useFold();
    const length = foldSplit === 'rows' ? height : width;

    let center = length / 2;
    let size = 0;
    if (Platform.OS === 'android' && fold != null) {
        const { x, y, width: foldWidth, height: foldHeight } = fold.bounds;
        center = foldSplit === 'rows' ? y + foldHeight / 2 : x + foldWidth / 2;
        size = foldSplit === 'rows' ? foldHeight : foldWidth;
    }
    const half = Math.max(size, FOLD_GAP) / 2;

    return { boardEnd: center - half, sheetStart: center + half };
};
