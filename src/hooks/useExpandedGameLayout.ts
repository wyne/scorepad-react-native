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

let foldSplitActive = false;
let hingeSubscription: { remove: () => void } | null = null;
let foldSettleTimer: ReturnType<typeof setTimeout> | null = null;
let lastMotionAngle: number | null = null;
const foldSplitListeners = new Set<() => void>();

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

const updateFoldSplitFromHinge = (hinge: HingeState | null) => {
    if (hinge?.status !== 'partiallyOpen') {
        cancelPendingFoldSplit();
        publishFoldSplit(false);
        return;
    }

    // Once book mode is visible, angle samples should not disturb it. Leaving
    // the partial status above dismisses it immediately.
    if (foldSplitActive) return;

    const movedMeaningfully = lastMotionAngle == null
        || Math.abs(hinge.angle - lastMotionAngle) >= MEANINGFUL_HINGE_ANGLE_DELTA;
    if (!movedMeaningfully && foldSettleTimer != null) return;

    lastMotionAngle = hinge.angle;
    if (foldSettleTimer != null) clearTimeout(foldSettleTimer);
    foldSettleTimer = setTimeout(() => {
        foldSettleTimer = null;
        lastMotionAngle = null;
        publishFoldSplit(true);
    }, FOLD_SETTLE_DELAY_MS);
};

// On Android the window manager's fold state decides on its own: it's the same
// source the split's direction and position come from, so the three never
// disagree. It has no angle, so each change restarts the settle delay.
const updateFoldSplitFromFold = (fold: Fold | null) => {
    if (fold?.state !== 'halfOpened') {
        cancelPendingFoldSplit();
        publishFoldSplit(false);
        return;
    }
    if (foldSplitActive) return;

    if (foldSettleTimer != null) clearTimeout(foldSettleTimer);
    foldSettleTimer = setTimeout(() => {
        foldSettleTimer = null;
        publishFoldSplit(true);
    }, FOLD_SETTLE_DELAY_MS);
};

const getFoldSplitSnapshot = (): boolean => foldSplitActive;

const subscribeToSettledFoldSplit = (listener: () => void): (() => void) => {
    if (Platform.OS !== 'ios' && Platform.OS !== 'android') return () => {};

    foldSplitListeners.add(listener);
    if (hingeSubscription == null) {
        if (Platform.OS === 'android') {
            hingeSubscription = addFoldListener(({ fold }) => updateFoldSplitFromFold(fold));
            updateFoldSplitFromFold(getFold());
        } else {
            hingeSubscription = Hinge.addHingeListener(({ hinge }) => updateFoldSplitFromHinge(hinge));
            updateFoldSplitFromHinge(Hinge.getHinge());
        }
    }

    return () => {
        foldSplitListeners.delete(listener);
        if (foldSplitListeners.size === 0) {
            hingeSubscription?.remove();
            hingeSubscription = null;
            cancelPendingFoldSplit();
            foldSplitActive = false;
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
