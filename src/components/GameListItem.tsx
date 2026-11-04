import React, { memo, useCallback, useMemo } from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ListItem } from '@rneui/base';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { shallowEqual } from 'react-redux';

import { selectGameById } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { grandTotalScore } from '../../redux/scoreUtils';
import { leadingPlayerIds } from '../../redux/ScoringRules';
import { setCurrentGameId } from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';
import { getPalette } from '../ColorPalette';
import { useTheme } from '../theme';

import AbstractPopupMenu from './PopupMenu/AbstractPopupMenu';

const DAY_MS = 86400000;

function timeAgo(dateMs: number): string {
    const diff = Date.now() - dateMs;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
}

/**
 * The calendar date behind a fuzzy one.
 *
 * Locale-formatted rather than hand-assembled, so the order of the parts
 * follows the device. Within the current year the weekday earns its place and
 * the year is redundant; further back that reverses.
 */
function shortDate(dateMs: number): string {
    const date = new Date(dateMs);
    const sameYear = date.getFullYear() === new Date().getFullYear();

    return date.toLocaleDateString(undefined, sameYear
        ? { weekday: 'short', month: 'short', day: 'numeric' }
        : { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * When the game was made, for the card's right-hand column: how long ago, and
 * the calendar date once "3d ago" stops being enough to place it. Under a day
 * the relative form is already the precise one, and a date would only ever
 * say today.
 */
export function formatCreated(dateMs: number | undefined): { relative: string; date?: string; } {
    if (!dateMs) return { relative: '' };
    if (Date.now() - dateMs < DAY_MS) return { relative: timeAgo(dateMs) };
    return { relative: timeAgo(dateMs), date: shortDate(dateMs) };
}

/** Names the way a sentence lists them: "A", "A and B", "A, B and C". */
export function joinNames(names: string[]): string {
    if (names.length <= 1) return names[0] ?? '';
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export interface GameResult {
    /** The players the line is about: the winners, or whoever leads. */
    playerIds: string[];
    text: string;
}

/**
 * How the game stands, in one line. A finished game names its winners; one in
 * play names the leader (the round is on the row's status pill). Before
 * anyone has scored there is no leader, so it says so.
 */
export function gameResult(
    game: { locked?: boolean; winnerIds?: string[]; roundTotal: number; scoring?: Parameters<typeof leadingPlayerIds>[0]; },
    players: { id: string; name: string; total: number; }[],
): GameResult {
    const nameOf = (id: string) => players.find(p => p.id === id)?.name ?? '';
    const totalOf = (id: string) => players.find(p => p.id === id)?.total ?? 0;
    const winnerIds = (game.winnerIds ?? []).filter(id => players.some(p => p.id === id));

    if (game.locked && winnerIds.length > 0) {
        const totals = winnerIds.map(totalOf);
        if (winnerIds.length === 1) {
            return { playerIds: winnerIds, text: `${nameOf(winnerIds[0])} won with ${totals[0]}` };
        }
        // Free play lets players pick any winners, whatever their totals, so
        // only call it a tie when the totals really are the same.
        if (totals.every(total => total === totals[0])) {
            return { playerIds: winnerIds, text: `${joinNames(winnerIds.map(nameOf))} tied with ${totals[0]}` };
        }
        const names = joinNames(winnerIds.map(id => `${nameOf(id)} (${totalOf(id)})`));
        return { playerIds: winnerIds, text: `${names} won` };
    }

    if (players.every(p => p.total === 0)) {
        return { playerIds: [], text: 'No scores yet' };
    }

    const leaders = leadingPlayerIds(game.scoring, players);
    const names = joinNames(leaders.map(nameOf));
    const verb = leaders.length > 1 ? 'tied at' : 'leads with';
    return { playerIds: leaders, text: `${names} ${verb} ${totalOf(leaders[0])}` };
}

/** How many player colors the row shows before the rest are left to the names. */
const MAX_STACK = 6;

export type Props = {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    gameId: string;
    index: number;
    /** Test-only render probe for selector invalidation regressions. */
    onRender?: (id: string) => void;
    /** Test-only render probe for popup menu selector invalidation regressions. */
    onMenuRender?: (id: string) => void;
};

const GameListItem: React.FunctionComponent<Props> = ({ navigation, gameId, index, onMenuRender, onRender }) => {
    onRender?.(gameId);

    const theme = useTheme();
    const dispatch = useAppDispatch();
    const {
        dateCreated,
        gameTitle,
        locked,
        palette,
        playerIds,
        roundCount,
        scoring,
        winnerIds,
    } = useAppSelector(state => {
        const game = selectGameById(state, gameId);

        return {
            dateCreated: game?.dateCreated,
            gameTitle: game?.title,
            locked: game?.locked,
            palette: game?.palette,
            playerIds: game?.playerIds,
            roundCount: game?.roundTotal,
            scoring: game?.scoring,
            winnerIds: game?.winnerIds,
        };
    }, shallowEqual);

    // Entities keep their identity until they change, so this only re-renders
    // the row when one of its players does.
    const playerEntities = useAppSelector(
        state => (playerIds ?? []).map(id => state.players.entities[id]),
        shallowEqual,
    );

    const players = useMemo(() => {
        const colors = getPalette(palette || 'original') || getPalette('original');
        return (playerIds ?? []).map((id, seat) => {
            const player = playerEntities[seat];
            return {
                id,
                name: player?.playerName ?? '',
                // A backup restore can leave scores malformed; a bad row must
                // not take the whole home screen down with it.
                total: grandTotalScore(Array.isArray(player?.scores) ? player.scores : []),
                color: player?.color || colors[seat % colors.length],
            };
        });
    }, [playerIds, playerEntities, palette]);

    const result = useMemo(() => (
        roundCount == null ? undefined : gameResult({ locked, winnerIds, roundTotal: roundCount, scoring }, players)
    ), [locked, winnerIds, roundCount, scoring, players]);

    const setCurrentGameCallback = useCallback(() => {
        dispatch(setCurrentGameId(gameId));
    }, [dispatch, gameId]);

    if (gameId == null) { return null; }
    if (gameTitle == null || roundCount == null || playerIds == null || result == null) { return null; }

    /**
     * Choose Game and navigate to GameScreen
     */
    const chooseGameHandler = () => {
        setCurrentGameCallback();
        navigation.navigate('Game');

        void logEvent('select_game', {
            list_index: index,
            game_id: gameId,
            player_count: playerIds.length,
            round_count: roundCount,
        });
    };

    // The result dot and the color stack lead with the players the result
    // line is about: the winners, or whoever leads.
    const featured = players.filter(p => result.playerIds.includes(p.id));
    const others = players.filter(p => !result.playerIds.includes(p.id));
    const resultColor = featured[0]?.color ?? theme.separator;
    const stack = [...featured, ...others].slice(0, MAX_STACK);
    // Dark palette colors (navy, forest) all but vanish on a dark card, so
    // the result dot gets a faint outline there.
    const isDark = theme.background === '#000000';
    const created = formatCreated(dateCreated);

    return (
        <Animated.View collapsable={false} entering={FadeInUp.duration(200).delay(100 + index * 100)}>
            <View style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
                <AbstractPopupMenu
                    key={'menu' + gameId}
                    gameId={gameId}
                    setCurrentGameCallback={setCurrentGameCallback}
                    chooseGameHandler={chooseGameHandler}
                    navigation={navigation}
                    index={index}
                    onRender={onMenuRender}
                >
                    <ListItem testID="game-list-item"
                        onPress={Platform.OS == 'android' ? undefined : chooseGameHandler}
                        containerStyle={[styles.itemContainer, { backgroundColor: theme.backgroundSecondary }]}
                    >
                        <ListItem.Content style={styles.content}>
                            <ListItem.Title style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                                {gameTitle}
                            </ListItem.Title>

                            <View style={styles.resultRow}>
                                <View
                                    testID="game-list-result-dot"
                                    style={[
                                        styles.resultDot,
                                        { backgroundColor: resultColor },
                                        isDark && styles.resultDotOutline,
                                    ]}
                                />
                                <Text style={[styles.result, { color: theme.text }]} numberOfLines={1} testID="game-list-result">
                                    {result.text}
                                </Text>
                            </View>

                            <View style={styles.playersRow}>
                                <View style={styles.stack} testID="game-list-colors">
                                    {stack.map((player, i) => (
                                        <View
                                            key={player.id}
                                            style={[
                                                styles.stackDot,
                                                { backgroundColor: player.color, borderColor: theme.backgroundSecondary },
                                                i > 0 && styles.stackOverlap,
                                            ]}
                                        />
                                    ))}
                                </View>
                                {others.length > 0 &&
                                    <Text style={[styles.players, { color: theme.textSecondary }]} numberOfLines={1} testID="game-list-players">
                                        {others.map(p => p.name).join(', ')}
                                    </Text>
                                }
                            </View>
                        </ListItem.Content>

                        {/* Status and date stack beside the chevron, centered in the
                          * card, so they line up down the right edge of the list. */}
                        <View style={styles.trailing}>
                            <View
                                testID="game-list-status"
                                style={[styles.pill, { backgroundColor: (locked ? theme.success : theme.tint) + (isDark ? '33' : '22') }]}
                            >
                                <Text style={[styles.pillText, { color: locked ? theme.success : theme.tint }]}>
                                    {locked ? 'Finished' : `Round ${roundCount}`}
                                </Text>
                            </View>
                            <Text style={[styles.timestamp, { color: theme.textTertiary }]} testID="game-list-created">
                                {created.relative}
                            </Text>
                            {created.date &&
                                <Text style={[styles.timestamp, { color: theme.textTertiary }]} testID="game-list-created-date">
                                    {created.date}
                                </Text>
                            }
                        </View>
                        <ListItem.Chevron iconStyle={{ color: theme.textTertiary }} />
                    </ListItem>
                </AbstractPopupMenu>
            </View>
        </Animated.View>
    );
};

const CARD_RADIUS = 12;
const DOT_SIZE = 14;
const RESULT_DOT_SIZE = 9;

const styles = StyleSheet.create({
    // Each game is its own card, so the list reads as separate games rather
    // than one block with lines through it.
    card: {
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: CARD_RADIUS,
        overflow: 'hidden',
    },
    itemContainer: {
        paddingVertical: 12,
        paddingLeft: 14,
        paddingRight: 10,
        gap: 10,
    },
    content: {
        gap: 4,
    },
    title: {
        fontWeight: '600',
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    resultDot: {
        width: RESULT_DOT_SIZE,
        height: RESULT_DOT_SIZE,
        borderRadius: RESULT_DOT_SIZE / 2,
    },
    resultDotOutline: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    result: {
        flexShrink: 1,
        fontSize: 15,
    },
    playersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stack: {
        flexDirection: 'row',
    },
    stackDot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        borderWidth: 2,
    },
    stackOverlap: {
        marginLeft: -5,
    },
    players: {
        flex: 1,
        fontSize: 13,
    },
    trailing: {
        alignItems: 'flex-end',
        gap: 3,
    },
    pill: {
        marginBottom: 3,
        borderRadius: 8,
        paddingHorizontal: 7,
        paddingVertical: 2,
    },
    pillText: {
        fontSize: 12,
        fontWeight: '600',
    },
    timestamp: {
        fontSize: 13,
    },
});

export default memo(GameListItem);
