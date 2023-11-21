import React from 'react';
import { Text, StyleSheet, Alert, Platform } from 'react-native';
import { ListItem , Icon } from 'react-native-elements';
import Moment from 'react-moment';
import Animated, { FadeInUp, SlideOutLeft } from 'react-native-reanimated';
import analytics from '@react-native-firebase/analytics';
import { MenuView, MenuAction, NativeActionEvent } from '@react-native-menu/menu';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';
import { AnyAction, ThunkDispatch } from '@reduxjs/toolkit';

import { selectGameById, gameDelete } from '../../redux/GamesSlice';
import { setCurrentGameId } from '../../redux/SettingsSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';


import GameListItemPlayerName from './GameListItemPlayerName';

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

    const asyncSetCurrentGame = (dispatch: ThunkDispatch<unknown, undefined, AnyAction>) => new Promise<void>((resolve) => {
        dispatch(setCurrentGameId(gameId));
        resolve();
    });

    /**
     * Choose Game and navigate to GameScreen
     */
    const chooseGameHandler = async () => {
        asyncSetCurrentGame(dispatch).then(() => {
            navigation.navigate("Game");
        });
        await analytics().logEvent('select_game', {
            index: index,
            game_id: gameId,
            player_count: playerIds.length,
            round_count: roundTotal,
        });
    };

    /**
     * Share Game
     */
    const shareGameHandler = async () => {
        asyncSetCurrentGame(dispatch).then(() => {
            navigation.navigate("Share");
        });

        await analytics().logEvent('menu_share', {
            round_count: roundTotal,
            player_count: playerIds.length,
        });
    };

    /**
     * Edit Game
     */
    const editGameHandler = async () => {
        asyncSetCurrentGame(dispatch).then(() => {
            navigation.navigate("Settings", { reason: 'edit_game' });
        });

        await analytics().logEvent('menu_edit', {
            round_count: roundTotal,
            player_count: playerIds.length,
        });
    };

    /**
     * Delete Game
     */
    const deleteGameHandler = async () => {
        Alert.alert(
            'Delete Game',
            `Are you sure you want to delete ${gameTitle}?`,
            [
                {
                    text: 'Cancel',
                    onPress: () => { },
                    style: 'cancel',
                },
                {
                    text: 'OK',
                    onPress: () => {
                        dispatch(gameDelete(gameId));
                    }
                },
            ],
            { cancelable: false },
        );

        await analytics().logEvent('delete_game', {
            index: index,
            round_count: roundTotal,
            player_count: playerIds.length,
        });
    };

    /**
     * Menu Actions for long press
     */
    const actions: MenuAction[] = [
        {
            id: 'edit',
            title: 'Edit',
            image: Platform.select({
                ios: 'pencil',
                android: 'ic_menu_edit',
            }),
        },
        {
            id: 'share',
            title: 'Share',
            image: Platform.select({
                ios: 'square.and.arrow.up',
                android: 'ic_menu_share',
            }),
        },
        {
            id: 'delete',
            title: `Delete`,
            attributes: {
                destructive: true,
            },
            image: Platform.select({
                ios: 'trash',
                android: 'ic_menu_delete',
            }),
        },
    ];

    type MenuActionHandler = (eativeEvent: NativeActionEvent) => void;

    /**
     * Menu Action Handler - handles long press actions for games
     * @param nativeEvent
     * @returns void
     */
    const menuActionHandler: MenuActionHandler = async ({ nativeEvent }) => {
        switch (nativeEvent.event) {
            case 'edit':
                editGameHandler();
                break;
            case 'share':
                shareGameHandler();
                break;
            case 'delete':
                deleteGameHandler();
                break;
        }
    };

    return (
        <Animated.View entering={FadeInUp.duration(200).delay(100 + index * 100)}
            exiting={SlideOutLeft.duration(200)}>
            <MenuView
                title={gameTitle}
                shouldOpenOnLongPress={true}
                onPressAction={menuActionHandler}
                actions={actions}>
                <ListItem key={gameId} bottomDivider onPress={chooseGameHandler}>
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
            </MenuView>
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
