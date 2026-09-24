import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { LayoutChangeEvent, LayoutRectangle, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements';
import Animated, { Easing, SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shallowEqual } from 'react-redux';

import { selectGameById } from '../../../redux/GamesSlice';
import { useAppSelector } from '../../../redux/hooks';
import DialOverlay from '../Interactions/Dial/DialOverlay';
import { useMenuOpen } from '../MenuOpenContext';
import { bottomSheetHeight } from '../Sheets/GameSheet';

const ROW_BOARD_PADDING = 12;

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
    svDimmed: SharedValue<boolean>;
    disabled: boolean;
    onRowPress: (id: string) => void;
    onRender?: (id: string) => void;
}

const PlayerRow: React.FC<PlayerRowProps> = ({ playerId, index, svDimmed, disabled, onRowPress, onRender }) => {
    onRender?.(playerId);

    const {
        playerName,
        color,
        locked,
        isWinner,
        currentRoundScore,
        previousTotal,
        currentRoundTotalScore,
    } = useAppSelector((state) => {
        const player = state.players.entities[playerId];
        const currentGameId = state.settings.currentGameId;
        const currentGame = currentGameId ? selectGameById(state, currentGameId) : undefined;
        const currentRoundIndex = currentGame?.roundCurrent ?? 0;
        const scores = player?.scores ?? [];
        const currentRoundScore = scores[currentRoundIndex] ?? 0;
        const previousTotal = scores.reduce(
            (sum, s, i) => (i < currentRoundIndex ? sum + (s || 0) : sum), 0
        );

        return {
            playerName: player?.playerName,
            color: player?.color ?? '#555',
            locked: currentGame?.locked === true,
            isWinner: !!(currentGame?.locked && currentGame?.winnerIds?.includes(playerId)),
            currentRoundScore,
            previousTotal,
            currentRoundTotalScore: previousTotal + currentRoundScore,
        };
    }, shallowEqual);
    const breakdownOpacity = useSharedValue(1);

    React.useEffect(() => {
        breakdownOpacity.value = withTiming(currentRoundScore !== 0 ? 1 : 0, { duration: 220 });
    }, [currentRoundScore]);

    const rowStyle = useAnimatedStyle(() => ({
        opacity: withTiming(svDimmed.value ? 0.28 : 1, { duration: 280 }),
    }));
    const breakdownStyle = useAnimatedStyle(() => ({ opacity: breakdownOpacity.value }));

    if (!playerName) return null;

    const ink = inkFor(color);

    const separatorSign = currentRoundScore < 0 ? '−' : '+';
    const roundAbs = Math.abs(currentRoundScore);

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
                onPress={() => onRowPress(playerId)}
                disabled={disabled}
                style={({ pressed }) => [styles.row, { backgroundColor: color, opacity: pressed ? 0.78 : 1 }]}>
                <View style={styles.rowInner}>
                    {/* Player name */}
                    <Text
                        style={[styles.playerName, { color: ink }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}>
                        {playerName}
                    </Text>

                    {/* Score section */}
                    <View style={styles.scoreMath}>
                        {locked ? (
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
                            <Text style={totalNumberStyle}>{currentRoundTotalScore}</Text>
                            <Text style={captionStyle}>TOTAL</Text>
                        </View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    );
};

const MemoizedPlayerRow = React.memo(PlayerRow);

interface ListBoardProps {
    showHint: boolean;
    onPlayerRowRender?: (id: string) => void;
}

const ListBoard: React.FC<ListBoardProps> = ({ showHint, onPlayerRowRender }) => {
    const { playerIds, locked } = useAppSelector((state) => {
        const currentGameId = state.settings.currentGameId;
        const currentGame = currentGameId ? selectGameById(state, currentGameId) : undefined;

        return {
            playerIds: currentGame?.playerIds,
            locked: currentGame?.locked === true,
        };
    }, shallowEqual);
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const { menuOpen } = useMenuOpen();
    const insets = useSafeAreaInsets();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [boardLayout, setBoardLayout] = useState<LayoutRectangle | null>(null);
    // Mirror boardLayout in a ref so handleRowPress can read the latest layout
    // without depending on the state value. Otherwise every onLayout pass (the
    // layout settles in multiple passes on first open) would recreate the
    // callback, change the onRowPress prop on every memoized row, and force the
    // entire row list to re-render.
    const boardLayoutRef = useRef<LayoutRectangle | null>(null);
    const svDimmed = useSharedValue(false);
    const svOverlayOpacity = useSharedValue(0);
    const svOverlaySlideY = useSharedValue(20);

    useLayoutEffect(() => {
        svDimmed.value = selectedId !== null;
    }, [selectedId]);

    const handleBoardLayout = useCallback((e: LayoutChangeEvent) => {
        boardLayoutRef.current = e.nativeEvent.layout;
        setBoardLayout(e.nativeEvent.layout);
    }, []);

    const handleRowPress = useCallback(
        (id: string) => {
            if (locked || menuOpen) return;
            if (!boardLayoutRef.current) return;
            // Start entrance animation before React schedules the re-render so the
            // overlay is already mid-animation by the time it first paints.
            svOverlayOpacity.value = 0;
            svOverlaySlideY.value = 20;
            svOverlayOpacity.value = withTiming(1, { duration: 160 });
            svOverlaySlideY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
            setSelectedId(id);
        },
        [locked, menuOpen]
    );

    const handleClose = useCallback(() => {
        setSelectedId(null);
    }, []);

    if (!playerIds?.length) return null;
    const scrollInsets = {
        bottom: fullscreen ? insets.bottom + 10 : bottomSheetHeight + 10,
        left: insets.left + ROW_BOARD_PADDING,
        right: insets.right + ROW_BOARD_PADDING,
    };

    return (
        <View style={styles.container} onLayout={handleBoardLayout} testID="list-board-container">
            <ScrollView
                testID="list-board-scroll"
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, {
                    paddingBottom: scrollInsets.bottom,
                    paddingLeft: scrollInsets.left,
                    paddingRight: scrollInsets.right,
                }]}
                alwaysBounceVertical
                showsVerticalScrollIndicator={false}
                scrollIndicatorInsets={scrollInsets}
                scrollEnabled={selectedId === null}>
                {playerIds.map((id, index) => (
                    <MemoizedPlayerRow
                        key={id}
                        playerId={id}
                        index={index}
                        svDimmed={svDimmed}
                        disabled={!!(locked || menuOpen)}
                        onRowPress={handleRowPress}
                        onRender={onPlayerRowRender}
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
                    showHint={showHint}
                    onClose={handleClose}
                    svOpacity={svOverlayOpacity}
                    svSlideY={svOverlaySlideY}
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
        paddingHorizontal: ROW_BOARD_PADDING
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

export default ListBoard;
