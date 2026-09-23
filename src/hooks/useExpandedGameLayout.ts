import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
