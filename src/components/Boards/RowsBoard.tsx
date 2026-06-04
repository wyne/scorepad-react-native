import React, { useCallback, useState } from 'react';

import { LayoutChangeEvent, LayoutRectangle, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppSelector } from '../../../redux/hooks';
import { selectPlayerById, selectPlayerRoundStats } from '../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../redux/selectors';
import DialOverlay from '../Interactions/Dial/DialOverlay';
import { useMenuOpen } from '../MenuOpenContext';
import { bottomSheetHeight } from '../Sheets/GameSheet';

// TODO: consolidate inkFor/inkA into a shared src/colorUtils.ts module and rename:
//   inkFor → readableColor (use getContrastRatio from 'colorsheet', add data migration
//   to backfill player colors, then introduce usePlayerColors hook)
//   inkA → withOpacity
//   Same change needed in DialOverlay.tsx and DialControl.tsx.
function inkFor(hex: string): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return L > 0.42 ? '#000' : '#fff';
}

function inkA(ink: string, a: number): string {
    return ink === '#000' ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
}

interface PlayerRowProps {
    playerId: string;
    index: number;
    roundCurrent: number;
    dimmed: boolean;
    disabled: boolean;
    onPress: () => void;
}

const PlayerRow: React.FC<PlayerRowProps> = ({ playerId, index, roundCurrent, dimmed, disabled, onPress }) => {
    const player = useAppSelector((state) => selectPlayerById(state, playerId));
    const currentGame = useAppSelector(selectCurrentGame);
    const isWinner = !!(currentGame?.locked && currentGame?.winnerIds?.includes(playerId));
    const { roundScore, previousTotal, currentTotal } = useAppSelector(
        (state) => selectPlayerRoundStats(state, playerId, roundCurrent)
    );
    const dimOpacity = useSharedValue(1);
    const breakdownOpacity = useSharedValue(1);

    React.useEffect(() => {
        dimOpacity.value = withTiming(dimmed ? 0.28 : 1, { duration: 280 });
    }, [dimmed]);

    React.useEffect(() => {
        breakdownOpacity.value = withTiming(roundScore !== 0 ? 1 : 0, { duration: 220 });
    }, [roundScore]);

    const rowStyle = useAnimatedStyle(() => ({ opacity: dimOpacity.value }));
    const breakdownStyle = useAnimatedStyle(() => ({ opacity: breakdownOpacity.value }));

    if (!player) return null;

    const color = player.color ?? '#555';
    const ink = inkFor(color);

    const separatorSign = roundScore < 0 ? '−' : '+';
    const roundAbs = Math.abs(roundScore);

    const secondaryNumberStyle = {
        color: inkA(ink, 0.45),
        fontSize: 18,
        fontWeight: '600' as const,
        lineHeight: 22,
        fontVariant: ['tabular-nums' as const]
    };
    const totalNumberStyle = {
        color: ink,
        fontSize: 20,
        fontWeight: '800' as const,
        lineHeight: 24,
        fontVariant: ['tabular-nums' as const]
    };
    const captionStyle = {
        color: inkA(ink, 0.65),
        fontSize: 8,
        fontWeight: '800' as const,
        letterSpacing: 1.0,
        marginTop: 1
    };
    const operatorStyle = { color: inkA(ink, 0.5), fontSize: 16, fontWeight: '500' as const };

    return (
        <Animated.View style={rowStyle} testID={`player-row-${index}`}>
            <Pressable
                onPress={onPress}
                disabled={disabled}
                style={({ pressed }) => [styles.row, { backgroundColor: color, opacity: pressed ? 0.78 : 1 }]}>
                <View style={styles.rowInner}>
                    {/* Player name */}
                    <Text
                        style={[styles.playerName, { color: ink }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}>
                        {player.playerName}
                    </Text>

                    {/* Score section */}
                    <View style={styles.scoreMath}>
                        {currentGame?.locked ? (
                            /* Locked: hide PREV/RND, show winner pill in that slot */
                            isWinner && (
                                <View style={styles.winnerBadge}>
                                    <Icon name="trophy" type="ionicon" color={inkA(ink, 0.75)} size={11} />
                                    <Text style={[styles.winnerText, { color: inkA(ink, 0.75) }]}>WINNER</Text>
                                </View>
                            )
                        ) : (
                            /* Unlocked: PREV/RND breakdown fades out when round score is 0 */
                            <Animated.View style={[styles.breakdown, breakdownStyle]}>
                                <View style={styles.scoreCol}>
                                    <Text style={secondaryNumberStyle}>{previousTotal}</Text>
                                    <Text style={captionStyle}>PREV</Text>
                                </View>
                                <Text style={operatorStyle}>{separatorSign}</Text>
                                <View style={styles.scoreCol}>
                                    <Text style={secondaryNumberStyle}>{roundAbs}</Text>
                                    <Text style={captionStyle}>RND</Text>
                                </View>
                                <Text style={operatorStyle}>=</Text>
                            </Animated.View>
                        )}
                        <View style={styles.scoreCol}>
                            <Text style={totalNumberStyle}>{currentTotal}</Text>
                            <Text style={captionStyle}>TOTAL</Text>
                        </View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
};

const RowsBoard: React.FC = () => {
    const currentGame = useAppSelector(selectCurrentGame);
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const { menuOpen } = useMenuOpen();
    const insets = useSafeAreaInsets();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [boardLayout, setBoardLayout] = useState<LayoutRectangle | null>(null);

    const handleBoardLayout = useCallback((e: LayoutChangeEvent) => {
        setBoardLayout(e.nativeEvent.layout);
    }, []);

    const handleRowPress = useCallback(
        (id: string) => {
            if (currentGame?.locked || menuOpen) return;
            if (!boardLayout) return;
            setSelectedId(id);
        },
        [boardLayout, currentGame?.locked, menuOpen]
    );

    const handleClose = useCallback(() => {
        setSelectedId(null);
    }, []);

    if (!currentGame) return null;
    const playerIds = currentGame.playerIds;
    if (!playerIds?.length) return null;
    const roundCurrent = currentGame.roundCurrent;

    return (
        <View style={styles.container} onLayout={handleBoardLayout} testID="rows-board-container">
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: fullscreen ? 10 : bottomSheetHeight + 10 }]}
                alwaysBounceVertical
                showsVerticalScrollIndicator={false}
                scrollEnabled={selectedId === null}>
                {playerIds.map((id, index) => (
                    <PlayerRow
                        key={id}
                        playerId={id}
                        index={index}
                        roundCurrent={roundCurrent}
                        dimmed={selectedId !== null}
                        disabled={!!(currentGame?.locked || menuOpen)}
                        onPress={() => handleRowPress(id)}
                    />
                ))}
            </ScrollView>

            {selectedId !== null && boardLayout !== null && (
                <DialOverlay
                    playerIds={playerIds}
                    initialIndex={playerIds.indexOf(selectedId)}
                    boardWidth={boardLayout.width}
                    boardHeight={boardLayout.height - (fullscreen ? 0 : bottomSheetHeight)}
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
        position: 'relative'
    },
    scroll: {
        flex: 1
    },
    scrollContent: {
        flexGrow: 1,
        gap: 10,
        paddingTop: 10,
        paddingBottom: bottomSheetHeight + 10,
        paddingHorizontal: 12
    },
    row: {
        borderRadius: 12,
        overflow: 'hidden'
    },
    rowInner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        gap: 8
    },
    playerName: {
        flex: 1,
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: -0.3
    },
    winnerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    winnerText: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    scoreMath: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexShrink: 0
    },
    breakdown: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    scoreCol: {
        alignItems: 'center'
    }
});

export default RowsBoard;
