import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

interface BadgeProps {
    index: number;
    /** The number's color: the tile or row text color. */
    color: string;
    /** The chip's fill: the text color at low opacity, so it reads on any player color. */
    background: string;
    /** Rows put the badge inline before the name; tiles pin it to the top-left corner. */
    inline?: boolean;
}

/** A small rounded chip with the player's number, tinted like the Winner tab. */
export const PlayerNumberBadge: React.FC<BadgeProps> = ({ index, color, background, inline = false }) => (
    <View
        testID="player-number-badge"
        pointerEvents="none"
        style={[inline ? styles.badgeInline : styles.badgeCorner, { backgroundColor: background }]}>
        <Text style={[inline ? styles.badgeTextInline : styles.badgeText, { color }]}>{index + 1}</Text>
    </View>
);

interface GhostProps {
    index: number;
    /** The text color at low opacity, so the numeral sits behind the score. */
    color: string;
    /** The tile's shorter side. The numeral scales with it, so it keeps its
     * proportions from 2 players to 12. Rows leave it out and use a fixed size. */
    shortEdge?: number;
}

const ROW_GHOST_SIZE = 84;

/** An oversized, faded numeral bleeding off the edge of the tile or row. */
export const PlayerNumberGhost: React.FC<GhostProps> = ({ index, color, shortEdge }) => {
    const label = String(index + 1);

    if (shortEdge == null) {
        return (
            <View testID="player-number-ghost" pointerEvents="none" style={styles.rowGhost}>
                <Text
                    style={[styles.ghostText, {
                        color,
                        fontSize: ROW_GHOST_SIZE,
                        lineHeight: ROW_GHOST_SIZE,
                        letterSpacing: -4,
                    }]}>
                    {label}
                </Text>
            </View>
        );
    }

    // Two digits shrink so both still fit across the tile.
    const fontSize = Math.round(shortEdge * (label.length > 1 ? 0.78 : 1.05));
    return (
        <View
            testID="player-number-ghost"
            pointerEvents="none"
            style={[styles.tileGhost, { right: -fontSize * 0.04, bottom: -fontSize * 0.22 }]}>
            <Text
                style={[styles.ghostText, {
                    color,
                    fontSize,
                    lineHeight: fontSize,
                    letterSpacing: -fontSize * 0.04,
                }]}>
                {label}
            </Text>
        </View>
    );
};

/** Space the row name leaves for the ghost numeral at its leading edge. */
export const ROW_GHOST_INSET = 30;

const styles = StyleSheet.create({
    badgeCorner: {
        position: 'absolute',
        top: 7,
        left: 7,
        minWidth: 22,
        height: 22,
        paddingHorizontal: 5,
        borderRadius: 7,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeInline: {
        minWidth: 26,
        height: 26,
        paddingHorizontal: 5,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        fontSize: 12.5,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
    },
    badgeTextInline: {
        fontSize: 14,
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
    },
    tileGhost: {
        position: 'absolute',
    },
    rowGhost: {
        position: 'absolute',
        left: -4,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    },
    ghostText: {
        fontWeight: '900',
        includeFontPadding: false,
    },
});
