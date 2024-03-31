import React from 'react';

import analytics from '@react-native-firebase/analytics';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Platform } from 'react-native';

import { asyncRematchGame, gameDelete, selectGameById } from '../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { selectCurrentGame } from '../../../redux/selectors';

import AndroidPopupMenu from './AndroidPopupMenu';
import IOSPopupMenu from './IOSPopupMenu';

interface Props {
    children: React.ReactNode;
    gameId: string;
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    setCurrentGameCallback: () => void;
    chooseGameHandler: () => void;
    index: number;
}

const AbstractPopupMenu: React.FC<Props> = (props) => {
    const dispatch = useAppDispatch();

    if (props.gameId == null) { return null; }
    const gameTitle = useAppSelector(state => selectGameById(state, props.gameId)?.title);
    const roundTotal = useAppSelector(state => selectGameById(state, props.gameId)?.roundTotal);
    const playerIds = useAppSelector(state => selectGameById(state, props.gameId)?.playerIds);
    const currentGame = useAppSelector(selectCurrentGame);
    if (roundTotal == null || playerIds == null) { return null; }

    /**
     * Share Game
     */
    const shareGameHandler = async () => {
        props.setCurrentGameCallback();
        props.navigation.navigate("Share");

        await analytics().logEvent('menu_share', {
            round_count: roundTotal,
            player_count: playerIds.length,
        });
    };

    /**
     * Edit Game
     */
    const editGameHandler = async () => {
        props.setCurrentGameCallback();
        props.navigation.navigate("Settings", { reason: 'edit_game' });

        await analytics().logEvent('menu_edit', {
            round_count: roundTotal,
            player_count: playerIds.length,
        });
    };

    /** 
     * Rematch Game
     */
    const rematchGameHandler = async () => {
        props.setCurrentGameCallback();
        if (currentGame) {
            dispatch(
                asyncRematchGame({ game: currentGame })
            ).then(() => {
                setTimeout(() => {
                    props.navigation.navigate("Game");
                }, 500);
            });
        }
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
                        dispatch(gameDelete(props.gameId));
                    }
                },
            ],
            { cancelable: false },
        );

        await analytics().logEvent('delete_game', {
            index: props.index,
            round_count: roundTotal,
            player_count: playerIds.length,
        });
    };

    return Platform.select({
        ios: (
            <IOSPopupMenu
                gameTitle={gameTitle}
                rematchGameHandler={rematchGameHandler}
                editGameHandler={editGameHandler}
                shareGameHandler={shareGameHandler}
                deleteGameHandler={deleteGameHandler}
            >
                {props.children}
            </IOSPopupMenu>
        ),
        android: (
            <AndroidPopupMenu
                gameTitle={gameTitle}
                chooseGameHandler={props.chooseGameHandler}
                editGameHandler={editGameHandler}
                shareGameHandler={shareGameHandler}
                deleteGameHandler={deleteGameHandler}
            >
                {props.children}
            </AndroidPopupMenu>
        ),
    });
};

export default AbstractPopupMenu;
