import React from 'react';
import { Text, StyleSheet, Alert } from 'react-native';
import { ListItem } from 'react-native-elements';
import Moment from 'react-moment';
import { Icon } from 'react-native-elements';
import Animated, { FadeInLeft, SlideOutLeft } from 'react-native-reanimated';
import analytics from '@react-native-firebase/analytics';

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
}

const GameListItem: React.FunctionComponent<Props> = ({ navigation, game, index }) => {
    const dispatch = useAppDispatch();
    const chosenGame = useAppSelector(state => selectGameById(state, game.id));
    const playerNames = useAppSelector(state =>
        selectAllPlayers(state).filter(player => game.playerIds.includes(player.id))
    )
        .sort((a, b) => game.playerIds.indexOf(a.id) - game.playerIds.indexOf(b.id))
        .map(player => player.playerName);

    const rounds: number = chosenGame?.roundTotal || 1;

    const asyncSetCurrentGame = (dispatch: ThunkDispatch<any, undefined, AnyAction>) => new Promise<void>((resolve, reject) => {
        dispatch(setCurrentGameId(game.id));
        resolve();
    });

    // Tap
    const chooseGameHandler = async () => {
        asyncSetCurrentGame(dispatch).then(() => {
            navigation.navigate("Game");
        });
        await analytics().logEvent('select_game', {
            index: index,
            game_id: game.id,
            player_count: playerNames.length,
            round_count: rounds + 1,
        });
    };

    // Long Press
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
            round_count: rounds + 1,
            player_count: playerNames.length,
        });
    };

    return (
        <Animated.View entering={FadeInLeft.delay(index * 100)}
            exiting={SlideOutLeft.duration(200)}>
            <ListItem key={game.id} bottomDivider
                onPress={chooseGameHandler}
                onLongPress={deleteGameHandler}>
                <ListItem.Content>
                    <ListItem.Title>{game.title}</ListItem.Title>
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
                    {rounds + 1} <Icon color={'#c25858'} name="circle-notch" type="font-awesome-5" size={16} />
                </Text>
                <ListItem.Chevron />
            </ListItem>
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