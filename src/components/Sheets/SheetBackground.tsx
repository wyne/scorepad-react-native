import React, { memo } from 'react';

import type { BottomSheetBackgroundProps } from '@gorhom/bottom-sheet';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme';

/**
 * Radius used by the sheet surface. Matches the library default so swapping in
 * this component does not change the silhouette.
 */
const SHEET_RADIUS = 15;

/**
 * Background for the bottom sheets.
 *
 * The library applies the `style` prop of `<BottomSheet>` to an outer,
 * *transparent* container. Android derives an `elevation` shadow from the
 * view's background outline, so an elevation on that transparent container is a
 * no-op — which is why the iOS-only `shadow*`/`elevation` block never produced
 * a shadow on Android. `elevation` is also not usable here even on the surface
 * itself: it reorders siblings on the Z axis and would paint the background
 * over the sheet's own content.
 *
 * Instead the surface itself is drawn here and separated from the board by:
 *  - `boxShadow`, which paints without touching Z ordering and is supported on
 *    both platforms under the New Architecture, and
 *  - a hairline border, which renders deterministically everywhere.
 *
 * The border is what actually guarantees the fix: `boxShadow` is gated on API
 * 28 on Android and silently does nothing below it, and even where it paints,
 * an upward shadow reads as very faint against a light board. The board behind
 * the collapsed sheet is `theme.background`, which is the same color as
 * `theme.sheetBackground` in light mode, so without the border there is no
 * contrast at all to fall back on.
 */
const SheetBackground: React.FunctionComponent<BottomSheetBackgroundProps> = ({ style, pointerEvents }) => {
    const theme = useTheme();

    return (
        <View
            pointerEvents={pointerEvents}
            accessible={true}
            accessibilityRole="adjustable"
            accessibilityLabel="Bottom Sheet"
            style={[
                style,
                styles.surface,
                {
                    backgroundColor: theme.sheetBackground,
                    borderColor: theme.sheetBorder,
                    boxShadow: `0px -3px 8px ${theme.sheetShadow}`,
                },
            ]}
        />
    );
};

const styles = StyleSheet.create({
    surface: {
        borderTopLeftRadius: SHEET_RADIUS,
        borderTopRightRadius: SHEET_RADIUS,
        // A full hairline border keeps the curve clean at the top corners; the
        // left, right and bottom edges sit off-screen or flush to the bezel.
        borderWidth: StyleSheet.hairlineWidth,
    },
});

export default memo(SheetBackground);
