import React, { memo, useCallback, useMemo } from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon, ListItem } from '@rneui/base';
import { PixelRatio, Platform, StyleSheet, Text, View } from 'react-native';
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
 * When the game was made, in the corner of its row: relative under a day,
 * where it's the precise form, and the calendar date after that.
 */
export function formatCreated(dateMs: number | undefined): string {
    if (!dateMs) return '';
    if (Date.now() - dateMs < DAY_MS) return timeAgo(dateMs);
    return shortDate(dateMs);
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
 * play names the leader and the round. Before anyone has scored there is no
 * leader, so it says so.
 */
export function gameResult(
    game: { locked?: boolean; winnerIds?: string[]; roundTotal: number; scoring?: Parameters<typeof leadingPlayerIds>[0]; },
    players: { id: string; name: string; total: number; }[],
): GameResult {
    const nameOf = (id: string) => players.find(p => p.id === id)?.name ?? '';
    const totalOf = (id: string) => players.find(p => p.id === id)?.total ?? 0;
    const winnerIds = (game.winnerIds ?? []).filter(id => players.some(p => p.id === id));

    if (game.locked && winnerIds.length > 0) {
        const names = joinNames(winnerIds.map(nameOf));
        const verb = winnerIds.length > 1 ? 'tied with' : 'won with';
        return { playerIds: winnerIds, text: `${names} ${verb} ${totalOf(winnerIds[0])}` };
    }

    const round = `Round ${game.roundTotal}`;
    if (players.every(p => p.total === 0)) {
        return { playerIds: [], text: `${round} · No scores yet` };
    }

    const leaders = leadingPlayerIds(game.scoring, players);
    const names = joinNames(leaders.map(nameOf));
    const verb = leaders.length > 1 ? 'tied at' : 'leads with';
    return { playerIds: leaders, text: `${names} ${verb} ${totalOf(leaders[0])} · ${round}` };
}

/** How many player colors the row shows before the rest are left to the names. */
const MAX_STACK = 6;

export type Props = {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    gameId: string;
    index: number;
    showSeparator?: boolean;
    /** Round the top corners: the first row of its day's group. */
    first?: boolean;
    /** Round the bottom corners: the last row of its day's group. */
    last?: boolean;
    /** Test-only render probe for selector invalidation regressions. */
    onRender?: (id: string) => void;
    /** Test-only render probe for popup menu selector invalidation regressions. */
    onMenuRender?: (id: string) => void;
};

const GameListItem: React.FunctionComponent<Props> = ({ navigation, gameId, index, showSeparator = false, first = false, last = false, onMenuRender, onRender }) => {
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
                total: grandTotalScore(player?.scores),
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

    const finished = locked && (winnerIds?.length ?? 0) > 0;
    // The result line already names its players, so the line below lists
    // everyone else. Its colors still cover the whole table, featured first.
    const others = players.filter(p => !result.playerIds.includes(p.id));
    const stack = [
        ...players.filter(p => result.playerIds.includes(p.id)),
        ...others,
    ].slice(0, MAX_STACK);

    return (
        <Animated.View collapsable={false} entering={FadeInUp.duration(200).delay(100 + index * 100)}>
            <View style={[
                styles.group,
                { backgroundColor: theme.backgroundSecondary },
                first && styles.groupFirst,
                last && styles.groupLast,
            ]}>
                {showSeparator && (
                    <View testID={`game-list-separator-${gameId}`} pointerEvents="none" style={[styles.separator, { backgroundColor: theme.separator }]} />
                )}
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
                        containerStyle={{ backgroundColor: theme.backgroundSecondary }}
                    >
                        <View style={styles.row}>
                            <ListItem.Content style={styles.content}>
                                <View style={styles.titleRow}>
                                    <ListItem.Title style={[styles.title, { color: theme.text }]} numberOfLines={1}>
                                        {gameTitle}
                                        {locked && <Icon name='lock-closed-outline' type='ionicon' size={14} color={theme.success} style={{ paddingHorizontal: 4 }} />}
                                    </ListItem.Title>
                                    <Text style={[styles.timestamp, { color: theme.textTertiary }]} testID="game-list-created">
                                        {formatCreated(dateCreated)}
                                    </Text>
                                </View>

                                <Text style={[styles.result, { color: theme.text }]} numberOfLines={1} testID="game-list-result">
                                    {finished && <Icon name="trophy" type="ionicon" size={13} color={theme.warning} />}
                                    {finished && ' '}
                                    {result.text}
                                </Text>

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
                            <ListItem.Chevron iconStyle={{ color: theme.textTertiary }} />
                        </View>
                    </ListItem>
                </AbstractPopupMenu>
            </View>
        </Animated.View>
    );
};

const GROUP_RADIUS = 12;
const DOT_SIZE = 14;

const styles = StyleSheet.create({
    // Rows sit in inset groups, one per day, like a settings list.
    group: {
        marginHorizontal: 16,
        overflow: 'hidden',
    },
    groupFirst: {
        borderTopLeftRadius: GROUP_RADIUS,
        borderTopRightRadius: GROUP_RADIUS,
    },
    groupLast: {
        borderBottomLeftRadius: GROUP_RADIUS,
        borderBottomRightRadius: GROUP_RADIUS,
    },
    separator: {
        marginLeft: 16,
        flexShrink: 0,
        // Android densities can be fractional: 1dp is not always a whole pixel.
        height: PixelRatio.roundToNearestPixel(1),
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 10,
    },
    content: {
        flex: 1,
        gap: 3,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
    },
    title: {
        flex: 1,
        fontWeight: '600',
    },
    timestamp: {
        fontSize: 13,
    },
    result: {
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
});

export default memo(GameListItem);
