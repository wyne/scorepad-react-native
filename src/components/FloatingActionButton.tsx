import React from 'react';

import { MenuAction, MenuView } from '@react-native-menu/menu';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-elements';

import { asyncCreateGame, selectAllGames } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { MAX_PLAYERS } from '../constants';
import { useTheme } from '../theme';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const FloatingActionButton: React.FunctionComponent<Props> = ({ navigation }) => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const gameList = useAppSelector(selectAllGames);

    const playerNumberOptions = [...Array.from(Array(MAX_PLAYERS).keys(), n => n + 1)];

    const menuActions: MenuAction[] = playerNumberOptions.map((number) => ({
        id: number.toString(),
        title: number.toString() + (number == 1 ? ' Player' : ' Players'),
    }));

    const addGameHandler = async (playerCount: number) => {
        dispatch(
            asyncCreateGame({ gameCount: gameList.length, playerCount })
        ).then(() => {
            setTimeout(() => {
                navigation.navigate('Settings', { source: 'new_game' });
            }, 500);
        });
    };

    return (
        <View style={styles.container}>
            <MenuView
                style={StyleSheet.absoluteFill}
                onPressAction={async ({ nativeEvent }) => {
                    const playerNumber = parseInt(nativeEvent.event);
                    addGameHandler(playerNumber);
                }}
                actions={menuActions}
            >
                <View style={[styles.fab, { backgroundColor: theme.tint }]} testID="add-game-button">
                    <Icon name="plus" type="font-awesome-5" size={24} color="#FFFFFF" />
                </View>
            </MenuView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 50,
        right: 20,
        width: 60,
        height: 60,
        zIndex: 100,
    },
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 8,
    },
});

export default FloatingActionButton;
