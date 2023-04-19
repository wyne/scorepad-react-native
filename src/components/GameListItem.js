import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { ListItem } from 'react-native-elements';
import { Swipeable } from 'react-native-gesture-handler';
import Moment from 'react-moment';
import { Icon } from 'react-native-elements';
import Animated, { FadeInLeft, SlideOutLeft } from 'react-native-reanimated';
import analytics from '@react-native-firebase/analytics';

import { selectGameById, gameDelete } from '../../redux/GamesSlice';
import { selectPlayersByIds } from '../../redux/ScoreSelectors';
import { setCurrentGameId } from '../../redux/SettingsSlice';

const GameListItem = ({ navigation, game, index }) => {
    const dispatch = useDispatch();
    const chosenGame = useSelector(state => selectGameById(state, game.id));
    const players = useSelector(state => selectPlayersByIds(state, game.playerIds));
    const playerNames = players.map(player => player.playerName).join(', ');
    const rounds = chosenGame.roundTotal;

    const asyncSetCurrentGame = (dispatch) => new Promise((resolve, reject) => {
        dispatch(setCurrentGameId(game.id));
        resolve();
    });

    // Tap
    const chooseGameHandler = () => {
        analytics().logEvent('game', {
            id: game.id,
            playerCount: players.count,
            roundCount: rounds + 1,
            dateCreated: game.dateCreated,
        });
        asyncSetCurrentGame(dispatch).then(() => {
            navigation.navigate("Game");
        });
    };

    // Long Press
    const deleteGameHandler = () => {
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
    };

    return (
        <Animated.View entering={FadeInLeft.delay(index * 100)}
            exiting={SlideOutLeft.duration(200)}
            backgroundColor="red">
            <ListItem key={game.id} bottomDivider
                onPress={chooseGameHandler}
                onLongPress={deleteGameHandler}>
                <ListItem.Content>
                    <ListItem.Title>{game.title}</ListItem.Title>
                    <ListItem.Subtitle style={styles.gameSubtitle}>
                        <Text><Moment element={Text} fromNow>{game.dateCreated}</Moment></Text>
                    </ListItem.Subtitle>
                    <ListItem.Subtitle style={styles.gameSubtitle}>
                        <Text>{playerNames}</Text>
                    </ListItem.Subtitle>
                </ListItem.Content>
                <Text style={styles.badgePlayers}>
                    {players.length} <Icon color={'#01497C'} name="users" type="font-awesome-5" size={16} />
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
