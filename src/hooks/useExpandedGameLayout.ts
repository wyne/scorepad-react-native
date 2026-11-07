import { useSyncExternalStore } from 'react';

import * as Hinge from 'expo-hinge';
import type { Hinge as HingeState } from 'expo-hinge';
import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { addFoldListener, getFold, useFold, type Fold } from '../../modules/fold-features';
import { useAppSelector } from '../../redux/hooks';

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

// A window whose shorter side is at least this wide has room to keep the game
// sheet docked open beside or below the board: iPads, the iPhone Duo's inner
// display, and Android tablets and unfolded foldables (Android's own tablet
// breakpoint). Every phone, in either orientation, is under it.
export const WIDE_WINDOW_MIN_SHORT_SIDE = 600;

/** Whether the window is big enough for the wide layouts (see WIDE_WINDOW_MIN_SHORT_SIDE). */
export const useWideWindow = (): boolean => {
    const { width, height } = useWindowDimensions();
    return Math.min(width, height) >= WIDE_WINDOW_MIN_SHORT_SIDE;
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

/**
 * The fold split while the device is settled partially open, whether or not
 * the game is in fullscreen. See useGameFoldSplit.
 */
const useSettledFoldSplit = (): GameFoldSplit | null => {
    const settledFoldSplit = useSyncExternalStore(
        subscribeToSettledFoldSplit,
        getFoldSplitSnapshot,
        () => false
    );
    const { width, height } = useWindowDimensions();
    const fold = useFold();

    if (!settledFoldSplit) return null;

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

export const useGameFoldSplit = (): GameFoldSplit | null => {
    const foldSplit = useSettledFoldSplit();
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);

    return fullscreen ? null : foldSplit;
};

/**
 * How the game screen docks the game sheet open, if it does: beside the board
 * (`columns`) or below it (`rows`). Docked, the sheet can't be dragged and the
 * board keeps to the rest of the window.
 *
 * It docks wherever there's room for it: across the fold of a partially open
 * foldable (see useGameFoldSplit), or in a wide window (see useWideWindow),
 * beside the board in landscape and below it in portrait. Null on phones and
 * in fullscreen, which hides the sheet so the board takes the whole window.
 */
export type GameDock = GameFoldSplit;

const useWideWindowDock = (): GameDock | null => {
    const { width, height } = useWindowDimensions();
    const wide = useWideWindow();

    if (!wide) return null;
    return width > height ? 'columns' : 'rows';
};

/** Where the game sheet docks, ignoring fullscreen. */
const useGameDockIgnoringFullscreen = (): GameDock | null => {
    const foldSplit = useSettledFoldSplit();
    const wideDock = useWideWindowDock();

    return foldSplit ?? wideDock;
};

export const useGameDock = (): GameDock | null => {
    const dock = useGameDockIgnoringFullscreen();
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);

    return fullscreen ? null : dock;
};

/**
 * Where the game sheet docks when it's showing, even in fullscreen. Docking is
 * when hiding and showing the sheet gets its own button in the header (see
 * GameOptionsButton): on phones the collapsed sheet already stays out of the
 * way.
 */
export const useAvailableGameDock = (): GameDock | null => useGameDockIgnoringFullscreen();

/**
 * Which docked layout the game screen has, if any: the dock's direction and
 * whether it splits at a fold or takes a panel in a wide window. The iPhone
 * Duo flat in landscape docks a panel beside the board, and folding it keeps
 * the direction but moves the split to the fold, so this tells them apart
 * where useGameDock doesn't.
 */
export type GameDockLayout = `${GameDock}-${'fold' | 'panel'}`;

export const useGameDockLayout = (): GameDockLayout | null => {
    const dock = useGameDock();
    const foldSplit = useGameFoldSplit();

    if (dock == null) return null;
    return `${dock}-${foldSplit === dock ? 'fold' : 'panel'}`;
};

/**
 * Whether the round picker has moved out of the header into the game sheet
 * docked beside the board (see GameSheet).
 */
export const useRoundPickerOutOfHeader = (): boolean => useGameDock() === 'columns';

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

// The docked sheet's size in a wide window, as a share of the window along
// the split, within these limits: wide enough for a few rounds of scores
// beside the board, and never so big that the board gets cramped.
const DOCK_COLUMN_SHARE = 0.34;
const DOCK_COLUMN_MIN = 320;
const DOCK_COLUMN_MAX = 420;
const DOCK_ROW_SHARE = 0.32;
const DOCK_ROW_MIN = 300;
const DOCK_ROW_MAX = 440;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Where the board ends and the docked sheet starts (see useFoldSplitBounds).
 * Across a fold the split follows the fold. In a wide window the sheet takes
 * a panel at the trailing edge, inside the safe area (the iPhone Duo's
 * vertical bar), or along the bottom.
 */
export const useGameDockBounds = (dock: GameDock | null): { boardEnd: number; sheetStart: number } => {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const foldSplit = useGameFoldSplit();
    const foldBounds = useFoldSplitBounds(dock);

    if (dock == null || foldSplit === dock) return foldBounds;

    if (dock === 'columns') {
        const contentWidth = width - insets.left - insets.right;
        const panel = Math.round(clamp(contentWidth * DOCK_COLUMN_SHARE, DOCK_COLUMN_MIN, DOCK_COLUMN_MAX));
        const sheetStart = width - insets.right - panel;
        return { boardEnd: sheetStart, sheetStart };
    }

    const panel = Math.round(clamp(height * DOCK_ROW_SHARE, DOCK_ROW_MIN, DOCK_ROW_MAX));
    const sheetStart = height - panel;
    return { boardEnd: sheetStart, sheetStart };
};
