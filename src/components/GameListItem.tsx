import React from 'react';
import { Text, StyleSheet, Alert, Platform } from 'react-native';
import { ListItem } from 'react-native-elements';
import Moment from 'react-moment';
import { Icon } from 'react-native-elements';
import Animated, { FadeInUp, SlideOutLeft } from 'react-native-reanimated';
import analytics from '@react-native-firebase/analytics';
import { MenuView, MenuAction, NativeActionEvent } from '@react-native-menu/menu';

import { selectGameById, gameDelete } from '../../redux/GamesSlice';
import { setCurrentGameId } from '../../redux/SettingsSlice';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { GameState } from '../../redux/GamesSlice';
import { AnyAction, ThunkDispatch } from '@reduxjs/toolkit';
import { selectAllPlayers } from '../../redux/PlayersSlice';

export type Props = {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    game: GameState;
    index: number;
};

const GameListItem: React.FunctionComponent<Props> = ({ navigation, game, index }) => {
    const dispatch = useAppDispatch();
    const chosenGame = useAppSelector(state => selectGameById(state, game.id));
    const playerNames = useAppSelector(state =>
        selectAllPlayers(state).filter(player => game.playerIds.includes(player.id))
    )
        .sort((a, b) => game.playerIds.indexOf(a.id) - game.playerIds.indexOf(b.id))
        .map(player => player.playerName);

    const rounds: number = chosenGame?.roundTotal || 1;

    const asyncSetCurrentGame = (dispatch: ThunkDispatch<unknown, undefined, AnyAction>) => new Promise<void>((resolve) => {
        dispatch(setCurrentGameId(game.id));
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
            game_id: game.id,
            player_count: playerNames.length,
            round_count: rounds,
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
            round_count: rounds,
            player_count: playerNames.length,
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
            round_count: rounds,
            player_count: playerNames.length,
        });
    };

    /**
     * Delete Game
     */
    const deleteGameHandler = async () => {
        Alert.alert(
            'Delete Game',
            `Are you sure you want to delete ${game.title}?`,
            [
                {
                    text: 'Cancel',
                    onPress: () => { },
                    style: 'cancel',
                },
                {
                    text: 'OK',
                    onPress: () => {
                        dispatch(gameDelete(game.id));
                    }
                },
            ],
            { cancelable: false },
        );

        await analytics().logEvent('delete_game', {
            index: index,
            round_count: rounds,
            player_count: playerNames.length,
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
        <Animated.View entering={FadeInUp.duration(200).delay(index * 100)}
            exiting={SlideOutLeft.duration(200)}>
            <MenuView
                title={game.title}
                shouldOpenOnLongPress={true}
                onPressAction={menuActionHandler}
                actions={actions}>
                <ListItem key={game.id} bottomDivider onPress={chooseGameHandler}>
                    <ListItem.Content>
                        <ListItem.Title style={{ alignItems: 'center' }}>
                            {game.title}
                            {game.locked && <Icon name="lock-closed-outline" type="ionicon" size={14} color='green' style={{ paddingHorizontal: 4 }} />}
                        </ListItem.Title>
                        <ListItem.Subtitle style={styles.gameSubtitle}>
                            <Text><Moment element={Text} fromNow>{game.dateCreated}</Moment></Text>
                        </ListItem.Subtitle>
                        <ListItem.Subtitle style={styles.gameSubtitle}>
                            <Text>{playerNames.join(', ')}</Text>
                        </ListItem.Subtitle>
                    </ListItem.Content>
                    <Text style={styles.badgePlayers}>
                        {playerNames.length} <Icon color={'#01497C'} name="users" type="font-awesome-5" size={16} />
                    </Text>
                    <Text style={styles.badgeRounds}>
                        {rounds} <Icon color={'#c25858'} name="circle-notch" type="font-awesome-5" size={16} />
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
