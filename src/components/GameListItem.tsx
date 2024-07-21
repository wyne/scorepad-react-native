import React, { useCallback } from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import Moment from 'react-moment';
import { StyleSheet, Text } from 'react-native';
import { Icon, ListItem } from 'react-native-elements';
import Animated, { FadeInUp, SlideOutLeft } from 'react-native-reanimated';

import { selectGameById } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { setCurrentGameId } from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';

import GameListItemPlayerName from './GameListItemPlayerName';
import AbstractPopupMenu from './PopupMenu/AbstractPopupMenu';

export type Props = {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    gameId: string;
    index: number;
};

const GameListItem: React.FunctionComponent<Props> = ({ navigation, gameId, index }) => {
    const dispatch = useAppDispatch();

    if (gameId == null) { return null; }

    const roundTotal = useAppSelector(state => selectGameById(state, gameId)?.roundTotal);
    const playerIds = useAppSelector(state => selectGameById(state, gameId)?.playerIds);
    const gameTitle = useAppSelector(state => selectGameById(state, gameId)?.title);
    const locked = useAppSelector(state => selectGameById(state, gameId)?.locked);
    const dateCreated = useAppSelector(state => selectGameById(state, gameId)?.dateCreated);
    if (roundTotal == null || playerIds == null) { return null; }

    const setCurrentGameCallback = useCallback(() => {
        dispatch(setCurrentGameId(gameId));
    }, [gameId]);

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
            round_count: roundTotal,
        });
    };

    return (
        <Animated.View entering={FadeInUp.duration(200).delay(100 + index * 100)}
            exiting={SlideOutLeft.duration(200)}>
            <AbstractPopupMenu
                gameId={gameId}
                setCurrentGameCallback={setCurrentGameCallback}
                chooseGameHandler={chooseGameHandler}
                navigation={navigation}
                index={index}
            >
                <ListItem key={gameId} bottomDivider
                    onLongPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        logEvent('list_menu_open');
                    }}
                    onPress={chooseGameHandler}>
                    <ListItem.Content>
                        <ListItem.Title style={{ alignItems: 'center' }}>
                            {gameTitle}
                            {locked && <Icon name="lock-closed-outline" type="ionicon" size={14} color='green' style={{ paddingHorizontal: 4 }} />}
                        </ListItem.Title>
                        <ListItem.Subtitle style={styles.gameSubtitle}>
                            <Text><Moment element={Text} fromNow>{dateCreated}</Moment></Text>
                        </ListItem.Subtitle>
                        <ListItem.Subtitle style={styles.gameSubtitle}>
                            {playerIds.map((playerId, index) => (
                                <GameListItemPlayerName key={index} playerId={playerId} last={index == playerIds.length - 1} />
                            ))}
                        </ListItem.Subtitle>
                    </ListItem.Content>
                    <Text style={styles.badgePlayers}>
                        {playerIds.length} <Icon color={'#01497C'} name="users" type="font-awesome-5" size={16} />
                    </Text>
                    <Text style={styles.badgeRounds}>
                        {roundTotal} <Icon color={'#c25858'} name="circle-notch" type="font-awesome-5" size={16} />
                    </Text>
                    <ListItem.Chevron />
                </ListItem>
            </AbstractPopupMenu>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    list: {
        borderTopWidth: 1,
        borderColor: '#eee',
        backgroundColor: 'white',
        flex: 1,
    },
    gameSubtitle: {
        color: '#999',
    },
    newGame: {
        margin: 20,
        width: 200,
        alignSelf: 'center',
    },
    badgePlayers: {
        color: '#01497C',
        alignItems: 'center',
        fontSize: 20,
    },
    badgeRounds: {
        color: '#c25858',
        alignItems: 'center',
        fontSize: 20,
    }
});

export default GameListItem;
