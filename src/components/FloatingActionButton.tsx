import React from 'react';

import { MenuAction, MenuView } from '@react-native-menu/menu';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { asyncCreateGame, selectAllGames } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { MAX_PLAYERS } from '../constants';
import { useTheme } from '../theme';

export const FAB_SIZE = 60;
export const FAB_EDGE_MARGIN = 20;
export const FAB_BOTTOM_MARGIN = 16;
export const FAB_LIST_CLEARANCE = 16;

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const FloatingActionButton: React.FunctionComponent<Props> = ({ navigation }) => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const gameList = useAppSelector(selectAllGames);
    const insets = useSafeAreaInsets();

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
        <View testID="add-game-button-container" style={[styles.container, {
            bottom: insets.bottom + FAB_BOTTOM_MARGIN,
            right: insets.right + FAB_EDGE_MARGIN,
        }]}>
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
        width: FAB_SIZE,
        height: FAB_SIZE,
        zIndex: 100,
    },
    fab: {
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
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
