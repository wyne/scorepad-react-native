import React from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Platform } from 'react-native';
import { shallowEqual } from 'react-redux';

import { asyncRematchGame, deleteGameAndPlayers, selectGameById } from '../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { logEvent } from '../../Analytics';

import AndroidPopupMenu from './AndroidPopupMenu';
import IOSPopupMenu from './IOSPopupMenu';

interface Props {
    children: React.ReactNode;
    gameId: string;
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    setCurrentGameCallback: () => void;
    chooseGameHandler: () => void;
    index: number;
    /** Test-only render probe for selector invalidation regressions. */
    onRender?: (id: string) => void;
}

const AbstractPopupMenu: React.FC<Props> = (props) => {
    props.onRender?.(props.gameId);

    const dispatch = useAppDispatch();
    const { gameTitle, playerIds, roundCount } = useAppSelector(state => {
        const game = selectGameById(state, props.gameId);

        return {
            gameTitle: game?.title,
            playerIds: game?.playerIds,
            roundCount: game?.roundTotal,
        };
    }, shallowEqual);

    if (props.gameId == null) { return null; }
    if (gameTitle == null || roundCount == null || playerIds == null) { return null; }

    /**
     * Share Game
     */
    const shareGameHandler = () => {
        props.setCurrentGameCallback();
        props.navigation.navigate('Share');

        void logEvent('menu_share', {
            round_count: roundCount,
            player_count: playerIds.length,
        });
    };

    /**
     * Edit Game
     */
    const editGameHandler = () => {
        props.setCurrentGameCallback();
        props.navigation.navigate('EditGame', { source: 'list_screen' });

        void logEvent('menu_edit', {
            round_count: roundCount,
            player_count: playerIds.length,
        });
    };

    /** 
     * Rematch Game
     */
    const rematchGameHandler = async () => {
        dispatch(
            asyncRematchGame({ gameId: props.gameId })
        ).then(() => {
            setTimeout(() => {
                props.navigation.navigate('Game');
            }, 500);
        });
    };

    /**
     * Delete Game
     */
    const deleteGameHandler = () => {
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
                        dispatch(deleteGameAndPlayers(props.gameId));
                        void logEvent('delete_game', {
                            list_index: props.index,
                            round_count: roundCount,
                            player_count: playerIds.length,
                        });
                    }
                },
            ],
            { cancelable: false },
        );
    };

    return Platform.select({
        ios: (
            <IOSPopupMenu
                gameId={props.gameId}
                gameTitle={gameTitle}
                chooseGameHandler={props.chooseGameHandler}
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
                rematchGameHandler={rematchGameHandler}
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
