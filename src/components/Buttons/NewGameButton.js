import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import * as Crypto from 'expo-crypto';

import { systemBlue } from '../../constants';
import HeaderButton from './HeaderButton';
import { gameSave, selectAllGames } from '../../../redux/GamesSlice';
import { playerAdd } from '../../../redux/PlayersSlice';
import { setCurrentGameId } from '../../../redux/SettingsSlice';

const NewGameButton = ({ navigation }) => {
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
            }, 500);
        });
    };

    useEffect(() => {
        if (gameList.length == 0) {
            addGameHandler();
        }
    }, [gameList.length]);

    return (
        <HeaderButton onPress={addGameHandler}>
            <Icon name="plus"
                type="font-awesome-5"
                size={20}
                color={systemBlue} />
        </HeaderButton>
    );
};

const styles = StyleSheet.create({
    multiplierButton: {
        color: systemBlue,
        fontSize: 20,
        fontVariant: ['tabular-nums'],
    },
    headerButton: {
        fontSize: 20,
        padding: 8,
        paddingHorizontal: 15,
    },
});

export default NewGameButton;
