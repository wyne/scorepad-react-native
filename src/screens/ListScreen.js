import React from 'react';
import { Text, View, StyleSheet, ScrollView, Alert } from 'react-native';
import { List, ListItem, Icon, Button, Avatar } from 'react-native-elements';
import { FlatList } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { useDispatch } from 'react-redux';
import Moment from 'react-moment';

import { gameUnset, } from '../../redux/CurrentGameSlice';
import {
    gameSave,
    selectGameById,
    gameDelete,
    selectGameIds,
    selectAllGames
} from '../../redux/GamesSlice';
import { scoreAdd, selectPlayerById } from '../../redux/PlayersSlice';
import { selectScoreByIds } from '../../redux/ScoreSelectors';
import { setCurrentGameId } from '../../redux/SettingsSlice';

const ListScreen = ({ navigation }) => {
    const dispatch = useDispatch();

    const selectCurrentGame = useSelector(state => state.currentGame);
    const gameList = useSelector(state => selectAllGames(state)).filter(game => typeof game !== 'undefined');

    const addGameHandler = () => {
        const player1Id = uuidv4();
        const player2Id = uuidv4();
        const newGameId = uuidv4();

        dispatch(scoreAdd({
            id: player1Id,
            playerName: "Player 1",
            scores: [0],
        }));
        dispatch(scoreAdd({
            id: player2Id,
            playerName: "Player 2",
            scores: [0],
        }));
        dispatch(gameSave({
            id: newGameId,
            title: 'Untitled',
            dateCreated: Date.now(),
            roundCurrent: 0,
            roundTotal: 1,
            scoreIds: [player1Id, player2Id],
        }));

        dispatch(setCurrentGameId(newGameId));
        navigation.navigate("Game")
    }

    const GamesFooter = () => {
        return (
            <View style={{
                paddingVertical: 20,
                backgroundColor: 'white'
            }} >
            </View>
        );
    };

    const GameRow = ({ game, i }) => {
        const chosenGame = useSelector(state => selectGameById(state, game.id));
        const players = useSelector(state => selectScoreByIds(state, game.scoreIds));
        const playerNames = players.map(player => player.playerName).join(', ');
        const rounds = chosenGame.roundTotal;

        // Tap
        const chooseGameHandler = () => {
            dispatch(setCurrentGameId(game.id));
            navigation.navigate("Game")
        }

        // Long Press
        const deleteGameHandler = () => {
            Alert.alert(
                'Delete Game',
                `Are you sure you want to delete ${game.id}?`,
                [
                    {
                        text: 'Cancel',
                        onPress: () => { },
                        style: 'cancel',
                    },
                    {
                        text: 'OK',
                        onPress: () => {
                            dispatch(gameUnset());
                            dispatch(gameDelete(game.id));
                        }
                    },
                ],
                { cancelable: false },
            );
        }

        return <ListItem key={game.id} bottomDivider
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
                title={`${rounds}R`}
                activeOpacity={0.7}
                titleStyle={{ color: '#c25858' }}
            />
            <ListItem.Chevron />
        </ListItem>
    }

    return (
        <View style={{ flex: 1 }}>
            <Button title="New Game" onPress={addGameHandler} />
            <FlatList
                style={styles.list}
                data={gameList}
                renderItem={({ item }) =>
                    <GameRow game={item} />
                }
                keyExtractor={item => item.id}
                ListFooterComponent={GamesFooter}>
            </FlatList>
        </View>
    );
}

const styles = StyleSheet.create({
    list: {
        backgroundColor: 'white',
        flex: 1,
    },
    gameSubtitle: {
        color: '#999',
    }
});

export default ListScreen;
