import React, { useCallback, useMemo, useRef, useState } from 'react';

import {
    BottomSheetBackdrop,
    BottomSheetBackdropProps,
    BottomSheetModal,
    BottomSheetScrollView
} from '@gorhom/bottom-sheet';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-elements';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { shallowEqual } from 'react-redux';

import { roundNext, updateGame } from '../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { GameOverReason, compareTotals, rankPlayers } from '../../../redux/ScoringRules';
import {
    selectCurrentGame,
    selectCurrentGameOverReason,
    selectCurrentGameTotals,
    selectInteractionType,
} from '../../../redux/selectors';
import { logEvent } from '../../Analytics';
import { getPalette } from '../../ColorPalette';
import { useTheme } from '../../theme';

import { useGameOverSheetContext } from './GameOverSheetContext';
import SheetBackground from './SheetBackground';

type TieBreak = 'all' | 'pick';

const joinNames = (names: string[]): string => {
    if (names.length <= 1) return names[0] ?? '';
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names.length} players`;
};

export const gameOverHeadline = (
    reason: GameOverReason,
    names: Record<string, string>,
    totals: Record<string, number>,
): string => {
    if (reason.type === 'rounds') {
        return `${reason.rounds} ${reason.rounds === 1 ? 'round' : 'rounds'} played`;
    }
    if (reason.playerIds.length === 1) {
        const id = reason.playerIds[0];
        return `${names[id]} reached ${totals[id]}`;
    }
    return `${joinNames(reason.playerIds.map(id => names[id]))} reached ${reason.target}`;
};

/**
 * Offered when a game with an end condition finishes its last round: the
 * final standings under the rules, a choice for a tie at the top, and either
 * End Game (locks it with the winners) or Keep Playing (on to another round).
 */
const GameOverSheet: React.FunctionComponent = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const insets = useSafeAreaInsets();
    const gameOverSheetRef = useGameOverSheetContext();

    const game = useAppSelector(selectCurrentGame);
    const liveReason = useAppSelector(selectCurrentGameOverReason);
    // Ending the game locks it, which clears the live reason. Keep showing
    // the last one so the sheet doesn't empty while it closes.
    const lastReason = useRef(liveReason);
    if (liveReason) lastReason.current = liveReason;
    const reason = liveReason ?? lastReason.current;
    const totals = useAppSelector(selectCurrentGameTotals);
    const interactionType = useAppSelector(state => selectInteractionType(state, game?.id));
    const players = useAppSelector(
        state => (game?.playerIds ?? []).map(id => state.players.entities[id]),
        shallowEqual,
    );

    const [tieBreak, setTieBreak] = useState<TieBreak>('all');
    const [pickedId, setPickedId] = useState<string>();

    const standings = useMemo(() => {
        const ranks = rankPlayers(game?.scoring, totals);
        const palette = getPalette(game?.palette || 'original') || getPalette('original');
        return [...totals]
            .sort((a, b) => compareTotals(game?.scoring, a.total, b.total))
            .map(({ id, total }) => {
                const player = players.find(p => p?.id === id);
                const seat = game?.playerIds.indexOf(id) ?? 0;
                return {
                    id,
                    total,
                    rank: ranks[id]?.rank ?? 0,
                    name: player?.playerName ?? '',
                    color: player?.color || palette[seat % palette.length],
                };
            });
    }, [game?.scoring, game?.palette, game?.playerIds, totals, players]);

    const leaderIds = standings.filter(row => row.rank === 1).map(row => row.id);
    const tied = leaderIds.length > 1;
    const winnerIds = tied && tieBreak === 'pick'
        ? (pickedId && leaderIds.includes(pickedId) ? [pickedId] : [])
        : leaderIds;

    const snapPoints = useMemo(() => ['80%'], []);

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                pressBehavior={0}
            />
        ),
        []
    );

    const reset = () => {
        setTieBreak('all');
        setPickedId(undefined);
    };

    const endGame = () => {
        if (!game || winnerIds.length === 0) return;

        dispatch(updateGame({
            id: game.id,
            changes: { locked: true, winnerIds },
        }));
        void logEvent('lock_game', {
            game_id: game.id,
            locked: true,
            winner_count: winnerIds.length,
        });
        void logEvent('game_complete', {
            game_id: game.id,
            player_count: game.playerIds.length,
            round_count: game.roundTotal,
            winner_count: winnerIds.length,
            duration_sec: game.dateCreated ? Math.round((Date.now() - game.dateCreated) / 1000) : 0,
            palette: game.palette,
            interaction: interactionType,
        });
        void logEvent('game_over', {
            game_id: game.id,
            action: 'end',
            reason: reason?.type ?? 'rounds',
            tied,
        });

        reset();
        gameOverSheetRef?.current?.close();
    };

    const keepPlaying = () => {
        if (!game) return;

        dispatch(roundNext(game.id));
        void logEvent('game_over', {
            game_id: game.id,
            action: 'keep_playing',
            reason: reason?.type ?? 'rounds',
            tied,
        });

        reset();
        gameOverSheetRef?.current?.close();
    };

    const names = Object.fromEntries(standings.map(row => [row.id, row.name]));
    const totalsById = Object.fromEntries(standings.map(row => [row.id, row.total]));
    const ruleLine = `${game?.scoring?.winner === 'low' ? 'Lowest' : 'Highest'} score wins.${tied ? ' It\'s a tie.' : ''}`;

    return (
        <BottomSheetModal
            ref={gameOverSheetRef}
            index={0}
            enablePanDownToClose={false}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            backgroundComponent={SheetBackground}
            handleIndicatorStyle={{ backgroundColor: theme.sheetHandle }}
            topInset={insets.top + 50}
            accessible={false}
            accessibilityViewIsModal={false}
        >
            <BottomSheetScrollView contentContainerStyle={styles.scrollContent} overScrollMode="always">
                <SafeAreaView edges={['right', 'left']}>
                    {reason && (
                        <View testID="game-over-sheet">
                            <Text style={[styles.eyebrow, { color: theme.textSecondary }]}>Game over</Text>
                            <Text style={[styles.headline, { color: theme.text }]} testID="game-over-headline">
                                {gameOverHeadline(reason, names, totalsById)}
                            </Text>
                            <Text style={[styles.rule, { color: theme.textSecondary }]} testID="game-over-rule">
                                {ruleLine}
                            </Text>

                            <View style={[styles.standings, { backgroundColor: theme.backgroundSecondary }]}>
                                {standings.map((row, index) => {
                                    const pickable = tied && tieBreak === 'pick' && row.rank === 1;
                                    const isWinner = winnerIds.includes(row.id);
                                    return (
                                        <React.Fragment key={row.id}>
                                            {index > 0 && (
                                                <View style={[styles.separator, { backgroundColor: theme.separator }]} />
                                            )}
                                            <TouchableOpacity
                                                testID={`game-over-row-${row.id}`}
                                                accessibilityRole={pickable ? 'radio' : undefined}
                                                accessibilityState={pickable ? { selected: isWinner } : undefined}
                                                disabled={!pickable}
                                                onPress={() => setPickedId(row.id)}
                                                style={styles.row}
                                            >
                                                <Text style={[
                                                    styles.rank,
                                                    { color: row.rank === 1 ? theme.text : theme.textSecondary },
                                                ]}>
                                                    {row.rank}
                                                </Text>
                                                <View style={[styles.colorBar, { backgroundColor: row.color }]} />
                                                <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                                                    {row.name}
                                                </Text>
                                                {isWinner && (
                                                    <Icon name="trophy" type="ionicon" color={theme.tint} size={16} />
                                                )}
                                                {pickable && !isWinner && (
                                                    <Icon name="ellipse-outline" type="ionicon" color={theme.textTertiary} size={18} />
                                                )}
                                                <Text style={[styles.total, { color: theme.text }]}>{row.total}</Text>
                                            </TouchableOpacity>
                                        </React.Fragment>
                                    );
                                })}
                            </View>

                            {tied && (
                                <View style={styles.tieBreak}>
                                    <Text style={[styles.tieLabel, { color: theme.textSecondary }]}>Break the tie</Text>
                                    <View style={[styles.segmented, { backgroundColor: theme.backgroundSecondary }]}>
                                        {([
                                            ['all', leaderIds.length === 2 ? 'Both win' : 'All win'],
                                            ['pick', 'Pick a winner'],
                                        ] as [TieBreak, string][]).map(([value, label]) => {
                                            const selected = tieBreak === value;
                                            return (
                                                <TouchableOpacity
                                                    key={value}
                                                    testID={`game-over-tie-${value}`}
                                                    accessibilityRole="button"
                                                    accessibilityState={{ selected }}
                                                    onPress={() => setTieBreak(value)}
                                                    style={[
                                                        styles.segment,
                                                        selected && { backgroundColor: theme.inputBackground },
                                                    ]}
                                                >
                                                    <Text style={[
                                                        styles.segmentLabel,
                                                        { color: theme.text },
                                                        selected && styles.segmentLabelSelected,
                                                    ]}>
                                                        {label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                    {tieBreak === 'pick' && (
                                        <Text style={[styles.tieHint, { color: theme.textSecondary }]}>
                                            Tap a tied player to make them the winner.
                                        </Text>
                                    )}
                                </View>
                            )}

                            <TouchableOpacity
                                testID="game-over-end"
                                accessibilityRole="button"
                                accessibilityState={{ disabled: winnerIds.length === 0 }}
                                disabled={winnerIds.length === 0}
                                onPress={endGame}
                                style={[
                                    styles.primaryButton,
                                    { backgroundColor: theme.tint, opacity: winnerIds.length === 0 ? 0.4 : 1 },
                                ]}
                            >
                                <Text style={styles.primaryLabel}>End Game</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                testID="game-over-keep-playing"
                                accessibilityRole="button"
                                onPress={keepPlaying}
                                style={styles.secondaryButton}
                            >
                                <Text style={[styles.secondaryLabel, { color: theme.tint }]}>Keep Playing</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </SafeAreaView>
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 60,
    },
    eyebrow: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    headline: {
        fontSize: 26,
        fontWeight: '700',
        marginTop: 4,
    },
    rule: {
        fontSize: 15,
        marginTop: 4,
        marginBottom: 16,
    },
    standings: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 16,
    },
    row: {
        alignItems: 'center',
        flexDirection: 'row',
        gap: 10,
        minHeight: 48,
        paddingHorizontal: 16,
    },
    rank: {
        fontSize: 15,
        fontVariant: ['tabular-nums'],
        fontWeight: '700',
        width: 22,
    },
    colorBar: {
        borderRadius: 2,
        height: 20,
        width: 4,
    },
    name: {
        flex: 1,
        fontSize: 17,
    },
    total: {
        fontSize: 17,
        fontVariant: ['tabular-nums'],
        fontWeight: '600',
        minWidth: 40,
        textAlign: 'right',
    },
    tieBreak: {
        marginTop: 20,
    },
    tieLabel: {
        fontSize: 13,
        marginBottom: 6,
    },
    segmented: {
        borderRadius: 9,
        flexDirection: 'row',
        gap: 2,
        padding: 2,
    },
    segment: {
        alignItems: 'center',
        borderRadius: 7,
        flex: 1,
        justifyContent: 'center',
        minHeight: 34,
    },
    segmentLabel: {
        fontSize: 15,
    },
    segmentLabelSelected: {
        fontWeight: '600',
    },
    tieHint: {
        fontSize: 13,
        marginTop: 6,
    },
    primaryButton: {
        alignItems: 'center',
        borderRadius: 12,
        justifyContent: 'center',
        marginTop: 24,
        minHeight: 50,
    },
    primaryLabel: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    secondaryButton: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
        minHeight: 48,
    },
    secondaryLabel: {
        fontSize: 17,
        fontWeight: '600',
    },
});

export default GameOverSheet;
