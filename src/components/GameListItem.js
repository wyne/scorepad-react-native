import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { ListItem, Avatar } from 'react-native-elements';
import { Swipeable } from 'react-native-gesture-handler';
import Moment from 'react-moment';
import { Icon } from 'react-native-elements';
import Animated, { FadeInLeft, FadeOutLeft, Layout, Easing, SlideOutLeft } from 'react-native-reanimated';

import { selectGameById, gameDelete } from '../../redux/GamesSlice';
import { selectPlayersByIds } from '../../redux/ScoreSelectors';
import { setCurrentGameId } from '../../redux/SettingsSlice';

const GameListItem = ({ navigation, game, index }) => {
    const dispatch = useDispatch();
    const chosenGame = useSelector(state => selectGameById(state, game.id));
    const players = useSelector(state => selectPlayersByIds(state, game.playerIds));
    const playerNames = players.map(player => player.playerName).join(', ');
    const rounds = chosenGame.roundTotal;

    // Tap
    const chooseGameHandler = () => {
        dispatch(setCurrentGameId(game.id));
        navigation.navigate("Game");
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
            exiting={SlideOutLeft.duration(200)}>
            <Swipeable renderRightActions={() =>  // Swipe Right
                <TouchableOpacity onPress={deleteGameHandler}>
                    <View style={{ backgroundColor: 'red', flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
                        <Icon size="20" name="trash" type="font-awesome-5" color="white" />
                    </View>
                </TouchableOpacity>
            }>
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
                    <Avatar size={"small"}
                        rounded
                        title={`${players.length}P`}
                        activeOpacity={0.7}
                        titleStyle={{ color: '#01497C' }}
                    />
                    <Avatar size={"small"}
                        rounded
                        title={`${rounds + 1}R`}
                        activeOpacity={0.7}
                        titleStyle={{ color: '#c25858' }}
                    />
                    <ListItem.Chevron />
                </ListItem>
            </Swipeable>
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
    }
});

export default GameListItem;
