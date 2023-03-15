import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-elements';
import { FlatList } from 'react-native-gesture-handler';
import * as Crypto from 'expo-crypto';
import { useDispatch, useSelector } from 'react-redux';

import { gameSave, selectAllGames } from '../../redux/GamesSlice';
import { playerAdd } from '../../redux/PlayersSlice';
import { setCurrentGameId } from '../../redux/SettingsSlice';
import GameListItem from '../components/GameListItem';

const ListScreen = ({ navigation }) => {
    const dispatch = useDispatch();

    const gameList = useSelector(state => selectAllGames(state));

    const asyncCreateGame = (dispatch) => new Promise((resolve, reject) => {
        const player1Id = Crypto.randomUUID();
        const player2Id = Crypto.randomUUID();
        const newGameId = Crypto.randomUUID();

        dispatch(playerAdd({
            id: player1Id,
            playerName: "Player 1",
            scores: [0],
        }));
        dispatch(playerAdd({
            id: player2Id,
            playerName: "Player 2",
            scores: [0],
        }));
        dispatch(gameSave({
            id: newGameId,
            title: `Game ${gameList.length + 1}`,
            dateCreated: Date.now(),
            roundCurrent: 0,
            roundTotal: 0,
            playerIds: [player1Id, player2Id],
        }));

        dispatch(setCurrentGameId(newGameId));
        resolve();
    });

    const addGameHandler = () => {
        asyncCreateGame(dispatch).then(() => {
            setTimeout(() => {
                navigation.navigate("Game");
            }, 1000);
        });
    };

    if (gameList.length == 0) {
        addGameHandler();
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

    return (
        <View style={{ flex: 1 }} backgroundColor={'white'}>
            <Button title="New Game" onPress={addGameHandler} style={styles.newGame} />
            <FlatList
                style={styles.list}
                data={gameList}
                renderItem={({ item, index }) =>
                    <GameListItem navigation={navigation} game={item} index={index} />
                }
                keyExtractor={item => item.id}
                ListFooterComponent={GamesFooter}>
            </FlatList>
        </View>
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

export default memo(ListScreen);
