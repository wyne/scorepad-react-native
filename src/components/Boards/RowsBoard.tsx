import React, { useCallback, useRef, useState } from 'react';

import { LayoutChangeEvent, LayoutRectangle, ScrollView, StyleSheet, Text, TouchableHighlight, View } from 'react-native';

interface ExpandRect {
    top: number;
    left: number;
    width: number;
    height: number;
}
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppSelector } from '../../../redux/hooks';
import { selectPlayerById } from '../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../redux/selectors';
import { bottomSheetHeight } from '../Sheets/GameSheet';
import InlineExpandOverlay from '../Interactions/Radial/InlineExpandOverlay';

function inkFor(hex: string): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const lin = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return L > 0.42 ? '#000' : '#fff';
}

function inkA(ink: string, a: number): string {
    return ink === '#000' ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
}

interface PlayerRowProps {
    playerId: string;
    roundCurrent: number;
    dimmed: boolean;
    onLayout: (rect: LayoutRectangle) => void;
    onPress: () => void;
}

const PlayerRow: React.FC<PlayerRowProps> = ({ playerId, roundCurrent, dimmed, onLayout, onPress }) => {
    const player = useAppSelector(state => selectPlayerById(state, playerId));
    const dimOpacity = useSharedValue(1);

    React.useEffect(() => {
        dimOpacity.value = withTiming(dimmed ? 0.28 : 1, { duration: 280 });
    }, [dimmed]);

    const rowStyle = useAnimatedStyle(() => ({ opacity: dimOpacity.value }));

    if (!player) return null;

    const color = player.color ?? '#555';
    const ink = inkFor(color);
    const roundScore = player.scores[roundCurrent] ?? 0;
    const prevTotal = player.scores.reduce(
        (sum, s, i) => i < roundCurrent ? sum + (s || 0) : sum,
        0,
    );
    const total = prevTotal + roundScore;

    const sepSign = roundScore < 0 ? '−' : '+';
    const roundAbs = Math.abs(roundScore);

    const secNumStyle = { color: inkA(ink, 0.45), fontSize: 18, fontWeight: '600' as const, lineHeight: 22 };
    const totNumStyle = { color: ink, fontSize: 20, fontWeight: '800' as const, lineHeight: 24 };
    const capStyle = { color: inkA(ink, 0.65), fontSize: 8, fontWeight: '800' as const, letterSpacing: 1.0, marginTop: 1 };
    const opStyle = { color: inkA(ink, 0.5), fontSize: 16, fontWeight: '500' as const };

    return (
        <Animated.View
            style={rowStyle}
            onLayout={(e: LayoutChangeEvent) => onLayout(e.nativeEvent.layout)}
        >
            <TouchableHighlight
                onPress={onPress}
                underlayColor={inkA(ink, 0.12)}
                style={[styles.row, { backgroundColor: color }]}
            >
                <View style={styles.rowInner}>
                    {/* Player name */}
                    <Text
                        style={[styles.playerName, { color: ink }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}
                    >
                        {player.playerName}
                    </Text>

                    {/* Score math: prev + round = total */}
                    <View style={styles.scoreMath}>
                        <View style={styles.scoreCol}>
                            <Text style={secNumStyle}>{prevTotal}</Text>
                            <Text style={capStyle}>PREV</Text>
                        </View>
                        <Text style={opStyle}>{sepSign}</Text>
                        <View style={styles.scoreCol}>
                            <Text style={secNumStyle}>{roundAbs}</Text>
                            <Text style={capStyle}>RND</Text>
                        </View>
                        <Text style={opStyle}>=</Text>
                        <View style={styles.scoreCol}>
                            <Text style={totNumStyle}>{total}</Text>
                            <Text style={capStyle}>TOTAL</Text>
                        </View>
                    </View>
                </View>
            </TouchableHighlight>
        </Animated.View>
    );
};

const RowsBoard: React.FC = () => {
    const currentGame = useAppSelector(selectCurrentGame);
    const insets = useSafeAreaInsets();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedRowRect, setSelectedRowRect] = useState<ExpandRect | null>(null);
    const [boardLayout, setBoardLayout] = useState<LayoutRectangle | null>(null);

    // Track each row's last-known layout (relative to ScrollView content, adjusted for scroll)
    const rowLayouts = useRef<Record<string, LayoutRectangle>>({});
    const scrollY = useRef(0);

    const handleBoardLayout = useCallback((e: LayoutChangeEvent) => {
        setBoardLayout(e.nativeEvent.layout);
    }, []);

    const handleRowLayout = useCallback((id: string, layout: LayoutRectangle) => {
        rowLayouts.current[id] = layout;
    }, []);

    const handleRowPress = useCallback((id: string) => {
        const layout = rowLayouts.current[id];
        if (!layout || !boardLayout) return;

        // Adjust for scroll offset to get position relative to the board container
        const adjustedRect: ExpandRect = {
            top: layout.y - scrollY.current,
            left: layout.x,
            width: layout.width,
            height: layout.height,
        };

        setSelectedRowRect(adjustedRect);
        setSelectedId(id);
    }, [boardLayout]);

    const handleClose = useCallback(() => {
        setSelectedId(null);
        setSelectedRowRect(null);
    }, []);

    if (!currentGame) return null;
    const playerIds = currentGame.playerIds;
    if (!playerIds?.length) return null;
    const roundCurrent = currentGame.roundCurrent;

    return (
        <View style={styles.container} onLayout={handleBoardLayout}>
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                scrollEnabled={selectedId === null}
                onScroll={(e) => { scrollY.current = e.nativeEvent.contentOffset.y; }}
                scrollEventThrottle={16}
            >
                {playerIds.map((id) => (
                    <PlayerRow
                        key={id}
                        playerId={id}
                        roundCurrent={roundCurrent}
                        dimmed={selectedId !== null && selectedId !== id}
                        onLayout={(rect) => handleRowLayout(id, rect)}
                        onPress={() => handleRowPress(id)}
                    />
                ))}
            </ScrollView>

            {selectedId !== null && selectedRowRect !== null && boardLayout !== null && (
                <InlineExpandOverlay
                    playerId={selectedId}
                    rowRect={selectedRowRect}
                    boardWidth={boardLayout.width}
                    boardHeight={boardLayout.height - bottomSheetHeight}
                    safeAreaTop={insets.top}
                    onClose={handleClose}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        gap: 10,
        paddingTop: 10,
        paddingBottom: bottomSheetHeight + 10,
        paddingHorizontal: 12,
    },
    row: {
        borderRadius: 22,
        overflow: 'hidden',
    },
    rowInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 8,
    },
    playerName: {
        flex: 1,
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    scoreMath: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0,
    },
    scoreCol: {
        alignItems: 'center',
    },
});

export default RowsBoard;
