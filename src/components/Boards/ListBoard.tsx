import React, { useCallback, useState } from 'react';

import { Icon } from '@rneui/base';
import { LayoutChangeEvent, LayoutRectangle, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { shallowEqual } from 'react-redux';

import { selectGameById } from '../../../redux/GamesSlice';
import { useAppSelector } from '../../../redux/hooks';
import { toScores, totalScoreBeforeRound } from '../../../redux/scoreUtils';
import { selectPlayerNumbers } from '../../../redux/selectors';
import type { GameFoldSplit } from '../../hooks/useExpandedGameLayout';
import DialOverlay from '../Interactions/Dial/DialOverlay';
import { useLockedHint } from '../LockedHintContext';
import { useMenuOpen } from '../MenuOpenContext';
import { PlayerNumberBadge, PlayerNumberGhost, ROW_GHOST_INSET } from '../PlayerTiles/PlayerNumber';
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
    /** 0 to 1: how far the dial is open, for dimming the rows behind it. */
    svDim: SharedValue<number>;
    svDialDragY: SharedValue<number>;
    dimRange: number;
    disabled: boolean;
    onRowPress: (id: string) => void;
    onRender?: (id: string) => void;
}

const PlayerRow: React.FC<PlayerRowProps> = ({ playerId, index, svDim, svDialDragY, dimRange, disabled, onRowPress, onRender }) => {
    onRender?.(playerId);

    const {
        playerName,
        color,
        locked,
        isWinner,
        currentRoundScore,
        previousTotal,
        currentRoundTotalScore,
        playerNumbers,
    } = useAppSelector((state) => {
        const player = state.players.entities[playerId];
        const currentGameId = state.settings.currentGameId;
        const currentGame = currentGameId ? selectGameById(state, currentGameId) : undefined;
        const currentRoundIndex = currentGame?.roundCurrent ?? 0;
        const scores = toScores(player?.scores);
        const currentRoundScore = scores[currentRoundIndex] ?? 0;
        const previousTotal = totalScoreBeforeRound(scores, currentRoundIndex);

        return {
            playerName: player?.playerName,
            color: player?.color ?? '#555',
            locked: currentGame?.locked === true,
            isWinner: !!(currentGame?.locked && currentGame?.winnerIds?.includes(playerId)),
            currentRoundScore,
            previousTotal,
            currentRoundTotalScore: previousTotal + currentRoundScore,
            playerNumbers: selectPlayerNumbers(state, currentGameId),
        };
    }, shallowEqual);
    const breakdownOpacity = useSharedValue(1);

    React.useEffect(() => {
        breakdownOpacity.value = withTiming(currentRoundScore !== 0 ? 1 : 0, { duration: 220 });
    }, [currentRoundScore]);

    const rowStyle = useAnimatedStyle(() => ({
        opacity: 1 - (1 - DIMMED_ROW_OPACITY) * rowDimProgress(svDim.value, svDialDragY.value, dimRange),
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
                style={({ pressed }) => [styles.row, { backgroundColor: color, opacity: pressed && !locked ? 0.78 : 1 }]}>
                {playerNumbers === 'big' && <PlayerNumberGhost index={index} color={inkA(ink, 0.14)} />}
                <View style={styles.rowInner}>
                    {playerNumbers === 'badge' && (
                        <PlayerNumberBadge index={index} color={ink} background={inkA(ink, 0.16)} inline />
                    )}
                    {/* Player name */}
                    <Text
                        style={[
                            styles.playerName,
                            { color: ink },
                            playerNumbers === 'big' && { paddingLeft: ROW_GHOST_INSET },
                        ]}
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

const DIMMED_ROW_OPACITY = 0.28;
const DIM_DURATION_MS = 280;

/** 0 to 1: how dimmed the rows are, given how far the dial is open and dragged down. */
export function rowDimProgress(open: number, dragY: number, range: number): number {
    'worklet';
    const dragged = Math.min(Math.max(dragY / range, 0), 1);
    return open * (1 - dragged);
}

const MemoizedPlayerRow = React.memo(PlayerRow);

interface ListBoardProps {
    foldSplit?: GameFoldSplit | null;
    /** Space at the top the rows can scroll under, e.g. a transparent header. */
    topInset?: number;
    /** Drawn above the rows but below an open dial, e.g. the gesture toast. */
    overlay?: React.ReactNode;
    onPlayerRowRender?: (id: string) => void;
}

const ListBoard: React.FC<ListBoardProps> = ({ foldSplit = null, topInset = 0, overlay, onPlayerRowRender }) => {
    const { playerIds, locked } = useAppSelector((state) => {
        const currentGameId = state.settings.currentGameId;
        const currentGame = currentGameId ? selectGameById(state, currentGameId) : undefined;

        return {
            playerIds: currentGame?.playerIds,
            locked: currentGame?.locked === true,
        };
    }, shallowEqual);
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    // The game sheet covers the bottom of the board unless it is hidden
    // (fullscreen) or docked beside it on a partially open iPhone Duo.
    const sheetOverBoard = !fullscreen && foldSplit == null;
    const { menuOpen } = useMenuOpen();
    const { showLockedHint } = useLockedHint();
    const insets = useSafeAreaInsets();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [boardLayout, setBoardLayout] = useState<LayoutRectangle | null>(null);
    const svDim = useSharedValue(0);
    const svOverlayOpacity = useSharedValue(0);
    const svOverlaySlideY = useSharedValue(20);
    const svDialDragY = useSharedValue(0);

    const handleBoardLayout = useCallback((e: LayoutChangeEvent) => {
        setBoardLayout(e.nativeEvent.layout);
    }, []);

    const handleRowPress = useCallback(
        (id: string) => {
            if (menuOpen) return;
            if (locked) {
                showLockedHint();
                return;
            }
            if (!boardLayout) return;
            // Start entrance animation before React schedules the re-render so the
            // overlay is already mid-animation by the time it first paints.
            svOverlayOpacity.value = 0;
            svOverlaySlideY.value = 20;
            svOverlayOpacity.value = withTiming(1, { duration: 160 });
            svOverlaySlideY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
            svDialDragY.value = 0;
            svDim.value = withTiming(1, { duration: DIM_DURATION_MS });
            setSelectedId(id);
        },
        [boardLayout, locked, menuOpen, showLockedHint]
    );

    const handleClose = useCallback(() => {
        // A swipe or Done has already carried the card off and un-dimmed the rows;
        // closing without that (e.g. the game got locked) fades them back here.
        svDim.value = withTiming(0, { duration: DIM_DURATION_MS });
        setSelectedId(null);
    }, []);

    if (!playerIds?.length) return null;
    // In the side-by-side layout the window's right inset belongs to the
    // docked sheet, not to the board that ends at the fold.
    const boardRightInset = foldSplit === 'columns' ? 0 : insets.right;
    // Without the sheet over it the board runs to the bottom of the screen,
    // except above the fold where the top half ends at the hinge.
    // Rows are back to full brightness once the card is dragged this far down.
    const dimRange = Math.max(1, (boardLayout?.height ?? 0) - (sheetOverBoard ? bottomSheetHeight : 0) - insets.top - topInset);
    const boardBottomInset = sheetOverBoard || foldSplit === 'rows' ? 0 : insets.bottom;
    const scrollInsets = {
        top: topInset,
        bottom: sheetOverBoard ? bottomSheetHeight + 10 : insets.bottom + 10,
        left: insets.left + ROW_BOARD_PADDING,
        right: boardRightInset + ROW_BOARD_PADDING,
    };

    return (
        <View style={styles.container} onLayout={handleBoardLayout} testID="list-board-container">
            <ScrollView
                testID="list-board-scroll"
                style={styles.scroll}
                contentContainerStyle={[styles.scrollContent, {
                    paddingTop: styles.scrollContent.paddingTop + topInset,
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
                        svDim={svDim}
                        svDialDragY={svDialDragY}
                        dimRange={dimRange}
                        disabled={menuOpen}
                        onRowPress={handleRowPress}
                        onRender={onPlayerRowRender}
                    />
                ))}
            </ScrollView>

            {overlay}

            {selectedId !== null && boardLayout !== null && (
                <DialOverlay
                    playerIds={playerIds}
                    initialIndex={playerIds.indexOf(selectedId)}
                    boardWidth={boardLayout.width}
                    boardHeight={boardLayout.height - (sheetOverBoard ? bottomSheetHeight : 0)}
                    safeAreaTop={insets.top + topInset}
                    safeAreaLeft={insets.left}
                    safeAreaRight={boardRightInset}
                    safeAreaBottom={boardBottomInset}
                    onClose={handleClose}
                    svOpacity={svOverlayOpacity}
                    svSlideY={svOverlaySlideY}
                    svDragY={svDialDragY}
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

export default React.memo(ListBoard);
