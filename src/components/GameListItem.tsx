import React, { memo, useCallback } from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Icon, ListItem } from 'react-native-elements';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { selectGameById } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { setCurrentGameId } from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';
import { useTheme } from '../theme';

import GameListItemPlayerName from './GameListItemPlayerName';
import AbstractPopupMenu from './PopupMenu/AbstractPopupMenu';

function timeAgo(dateMs: number | undefined): string {
    if (!dateMs) return '';
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

export type Props = {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    gameId: string;
    index: number;
};

const GameListItem: React.FunctionComponent<Props> = ({ navigation, gameId, index }) => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const game = useAppSelector(state => selectGameById(state, gameId));

    const setCurrentGameCallback = useCallback(() => {
        dispatch(setCurrentGameId(gameId));
    }, [gameId]);

    if (gameId == null) { return null; }
    if (!game) { return null; }

    const { roundTotal: roundCount, playerIds, title: gameTitle, locked, winnerIds, dateCreated } = game;
    if (roundCount == null || playerIds == null) { return null; }

    /**
     * Choose Game and navigate to GameScreen
     */
    const chooseGameHandler = async () => {
        setCurrentGameCallback();
        navigation.navigate('Game');

        await logEvent('select_game', {
            index: index,
            game_id: gameId,
            player_count: playerIds.length,
            round_count: roundCount,
        });
    };

    return (
        <Animated.View entering={FadeInUp.duration(200).delay(100 + index * 100)}>
            <AbstractPopupMenu
                key={'menu' + gameId}
                gameId={gameId}
                setCurrentGameCallback={setCurrentGameCallback}
                chooseGameHandler={chooseGameHandler}
                navigation={navigation}
                index={index}
            >
                <ListItem bottomDivider testID="game-list-item"
                    onPress={Platform.OS == 'android' ? undefined : chooseGameHandler}
                    containerStyle={{ backgroundColor: theme.backgroundSecondary, borderBottomColor: theme.separator }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 16 }}>
                        <ListItem.Content style={{ flex: 1 }}>
                            <ListItem.Title style={{ alignItems: 'center', color: theme.text }}>
                                {gameTitle}
                                {locked && <Icon name='lock-closed-outline' type='ionicon' size={14} color={theme.success} style={{ paddingHorizontal: 4 }} />}
                            </ListItem.Title>
                            <ListItem.Subtitle style={{ color: theme.textTertiary }}>
                                <Text>{timeAgo(dateCreated)}</Text>
                            </ListItem.Subtitle>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                {playerIds.map((playerId, index) => (
                                    <GameListItemPlayerName key={playerId} playerId={playerId} last={index == playerIds.length - 1} isWinner={winnerIds?.includes(playerId) === true} />
                                ))}
                            </View>
                        </ListItem.Content>
                        <Text style={[styles.badgePlayers, { color: theme.badgeBlue }]}>
                            {playerIds.length} <Icon color={theme.badgeBlue} name='users' type='font-awesome-5' size={16} />
                        </Text>
                        <Text style={[styles.badgeRounds, { color: theme.badgeRed }]}>
                            {roundCount} <Icon color={theme.badgeRed} name='circle-notch' type='font-awesome-5' size={16} />
                        </Text>
                        <ListItem.Chevron iconStyle={{ color: theme.separator }} />
                    </View>
                </ListItem>
            </AbstractPopupMenu>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    newGame: {
        margin: 20,
        width: 200,
        alignSelf: 'center',
    },
    badgePlayers: {
        alignItems: 'center',
        fontSize: 20,
    },
    badgeRounds: {
        alignItems: 'center',
        fontSize: 20,
    }
});

export default memo(GameListItem);
