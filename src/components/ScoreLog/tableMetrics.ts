import { StyleSheet } from 'react-native';

/**
 * Shared sizes for the score sheet table. Every column draws its header and
 * rows at these fixed heights, so rows line up across the frozen columns and
 * the scrolling rounds, and the row lines join into one rule.
 *
 * One notch below the old 20pt so the frozen name and total columns leave
 * room for the rounds on a phone.
 */
export const TABLE_FONT_SIZE = 17;
export const TABLE_HEADER_FONT_SIZE = 13;
export const TABLE_HEADER_HEIGHT = 32;
export const TABLE_ROW_HEIGHT = 36;
export const TABLE_CELL_PADDING = 10;
export const TABLE_RULE_WIDTH = StyleSheet.hairlineWidth;

/** The current round's column: the app tint, faint enough for both themes. */
export const CURRENT_ROUND_BACKGROUND = 'rgba(10,132,255,0.12)';

export const tableStyles = StyleSheet.create({
    header: {
        height: TABLE_HEADER_HEIGHT,
        lineHeight: TABLE_HEADER_HEIGHT,
        fontSize: TABLE_HEADER_FONT_SIZE,
        fontWeight: '600',
        textAlign: 'center',
    },
    cell: {
        height: TABLE_ROW_HEIGHT,
        lineHeight: TABLE_ROW_HEIGHT,
        fontSize: TABLE_FONT_SIZE,
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
        borderTopWidth: TABLE_RULE_WIDTH,
    },
});
