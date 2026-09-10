import React, { memo, useCallback, useMemo } from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PixelRatio, Platform, StyleSheet, Text, View } from 'react-native';
import { Icon, ListItem } from 'react-native-elements';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { shallowEqual } from 'react-redux';

import { selectGameById } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { setCurrentGameId } from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';
import { useTheme } from '../theme';

import GameListItemPlayerName from './GameListItemPlayerName';
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
 * How long ago, plus the date once "3mo ago" stops being enough to place it.
 *
 * Under a day the relative form is already the precise one — appending a date
 * there would only ever say today.
 */
function formatCreated(dateMs: number | undefined): string {
    if (!dateMs) return '';

    const relative = timeAgo(dateMs);
    if (Date.now() - dateMs < DAY_MS) return relative;

    return `${relative} · ${shortDate(dateMs)}`;
}

export type Props = {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    gameId: string;
    index: number;
    showSeparator?: boolean;
    /** Test-only render probe for selector invalidation regressions. */
    onRender?: (id: string) => void;
    /** Test-only render probe for popup menu selector invalidation regressions. */
    onMenuRender?: (id: string) => void;
};

const GameListItem: React.FunctionComponent<Props> = ({ navigation, gameId, index, showSeparator = false, onMenuRender, onRender }) => {
    onRender?.(gameId);

    const theme = useTheme();
    const dispatch = useAppDispatch();
    const {
        dateCreated,
        gameTitle,
        locked,
        playerIds,
        roundCount,
        winnerIds,
    } = useAppSelector(state => {
        const game = selectGameById(state, gameId);

        return {
            dateCreated: game?.dateCreated,
            gameTitle: game?.title,
            locked: game?.locked,
            playerIds: game?.playerIds,
            roundCount: game?.roundTotal,
            winnerIds: game?.winnerIds,
        };
    }, shallowEqual);

    const setCurrentGameCallback = useCallback(() => {
        dispatch(setCurrentGameId(gameId));
    }, [dispatch, gameId]);

    /**
     * Winners lead the player line.
     *
     * That line truncates, and the result of a finished game is the last thing
     * that should be cut from it — with the roster in play order a winner far
     * enough down simply disappeared. Sorting is stable, so within each group
     * the play order is kept.
     */
    const orderedPlayerIds = useMemo(() => {
        const ids = playerIds ?? [];
        if (!winnerIds?.length) return ids;

        return [...ids].sort((a, b) =>
            Number(winnerIds.includes(b)) - Number(winnerIds.includes(a)));
    }, [playerIds, winnerIds]);

    if (gameId == null) { return null; }
    if (gameTitle == null || roundCount == null || playerIds == null) { return null; }

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

    return (
        <Animated.View collapsable={false} entering={FadeInUp.duration(200).delay(100 + index * 100)}>
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
                            <ListItem.Title style={[styles.title, { color: theme.text }]}>
                                {gameTitle}
                                {locked && <Icon name='lock-closed-outline' type='ionicon' size={14} color={theme.success} style={{ paddingHorizontal: 4 }} />}
                            </ListItem.Title>

                            {/* One run of text, so the names wrap and truncate
                              * together instead of each being its own block.
                              *
                              * Two lines rather than one: the column is ~29
                              * characters wide, and players default to names as
                              * long as "Player 1", so a single line cut an
                              * ordinary three-player game short. Two covers past
                              * the 91st percentile of player counts while still
                              * keeping every row the same height. */}
                            <Text style={[styles.players, { color: theme.textSecondary }]} numberOfLines={2} testID="game-list-players">
                                {orderedPlayerIds.map((playerId, index) => (
                                    <GameListItemPlayerName key={playerId} playerId={playerId} last={index == orderedPlayerIds.length - 1} isWinner={winnerIds?.includes(playerId) === true} />
                                ))}
                            </Text>

                            {/* Metadata trails the content it describes rather
                              * than splitting the title from the players. */}
                            <Text style={[styles.timestamp, { color: theme.textTertiary }]}>
                                {formatCreated(dateCreated)}
                            </Text>
                        </ListItem.Content>
                        <View style={styles.badgeGroup}>
                            <Text style={[styles.badge, { color: theme.badgeBlue }]}>
                                {playerIds.length}
                            </Text>
                            <Icon color={theme.badgeBlue} name='users' type='font-awesome-5' size={13} />
                        </View>
                        <View style={styles.badgeGroup}>
                            <Text style={[styles.badge, { color: theme.badgeRed }]}>
                                {roundCount}
                            </Text>
                            <Icon color={theme.badgeRed} name='circle-notch' type='font-awesome-5' size={13} />
                        </View>
                        <ListItem.Chevron iconStyle={{ color: theme.textTertiary }} />
                    </View>
                </ListItem>
            </AbstractPopupMenu>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
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
        gap: 14,
    },
    content: {
        flex: 1,
        // Three text lines that were previously flush against each other.
        gap: 3,
    },
    players: {
        fontSize: 15,
    },
    title: {
        fontWeight: '600',
    },
    timestamp: {
        fontSize: 13,
    },
    /**
     * Counts are the least important thing in the row. At 20pt they read before
     * the game title; at 15 they sit with the secondary text where they belong.
     */
    badge: {
        fontSize: 15,
    },
    badgeGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
});

export default memo(GameListItem);
