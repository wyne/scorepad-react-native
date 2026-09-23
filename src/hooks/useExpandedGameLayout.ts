import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The shortest landscape iPhone window is well under this; the iPhone Duo's
// unfolded inner display is well over it.
const EXPANDED_MIN_HEIGHT = 600;

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
