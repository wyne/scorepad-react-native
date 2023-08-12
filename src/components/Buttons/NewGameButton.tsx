import React, { useEffect } from 'react';
import { Icon } from 'react-native-elements';
import * as Crypto from 'expo-crypto';
import analytics from '@react-native-firebase/analytics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';

import { useAppSelector, useAppDispatch } from '../../../redux/hooks';
import { systemBlue } from '../../constants';
import HeaderButton from './HeaderButton';
import { gameSave, selectAllGames } from '../../../redux/GamesSlice';
import { playerAdd } from '../../../redux/PlayersSlice';
import { setCurrentGameId } from '../../../redux/SettingsSlice';
import { AnyAction, ThunkDispatch } from '@reduxjs/toolkit';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>
}

const NewGameButton: React.FunctionComponent<Props> = ({ navigation }) => {
    const dispatch = useAppDispatch();

    const gameList = useAppSelector(state => selectAllGames(state));

    const asyncCreateGame = (dispatch: ThunkDispatch<unknown, undefined, AnyAction>) => new Promise<void>((resolve) => {
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

    const addGameHandler = async () => {
        asyncCreateGame(dispatch).then(() => {
            setTimeout(() => {
                navigation.navigate("Game");
            }, 500);
        });
        await analytics().logEvent('new_game', {
            index: gameList.length,
        });
    };

    useEffect(() => {
        if (gameList.length == 0) {
            addGameHandler();
        }
    }, [gameList.length]);

    return (
        <HeaderButton accessibilityLabel='Add Game' onPress={addGameHandler}>
            <Icon name="plus"
                type="font-awesome-5"
                size={20}
                color={systemBlue} />
        </HeaderButton>
    );
};

export default NewGameButton;
