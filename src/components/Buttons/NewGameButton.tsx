import React from 'react';

import { MenuAction, MenuView } from '@react-native-menu/menu';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Icon } from 'react-native-elements';

import { asyncCreateGame, selectAllGames } from '../../../redux/GamesSlice';
import { useAppSelector, useAppDispatch } from '../../../redux/hooks';
import { systemBlue } from '../../constants';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const NewGameButton: React.FunctionComponent<Props> = ({ navigation }) => {
    const dispatch = useAppDispatch();

    const gameList = useAppSelector(selectAllGames);

    const playerNumberOptions = [...Array.from(Array(12).keys(), n => n + 1)];

    const menuActions: MenuAction[] = playerNumberOptions.map((number) => {
        return {
            id: number.toString(),
            title: number.toString() + (number == 1 ? " Player" : " Players"),
        };
    });

    const addGameHandler = async (playerCount: number) => {
        dispatch(
            asyncCreateGame({
                gameCount: gameList.length,
                playerCount: playerCount
            })
        ).then(() => {
            setTimeout(() => {
                navigation.navigate("Settings", { reason: 'new_game' });
            }, 500);
        });
    };

    return (
        <MenuView
            style={{
                padding: 10,
                paddingHorizontal: 15,
            }}

            onPressAction={async ({ nativeEvent }) => {
                const playerNumber = parseInt(nativeEvent.event);
                addGameHandler(playerNumber);
            }}
            actions={menuActions}>
            <Icon name="plus"
                type="font-awesome-5"
                size={20}
                color={systemBlue} />
        </MenuView>
    );
};

export default NewGameButton;
