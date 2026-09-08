import React from 'react';

import { MenuAction, MenuView } from '@react-native-menu/menu';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GlassView } from 'expo-glass-effect';
import { Keyboard, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { asyncCreateGame, selectGameIds } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { MAX_PLAYERS } from '../constants';
import { LIQUID_GLASS } from '../platform';
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
    const gameCount = useAppSelector(state => selectGameIds(state).length);
    const insets = useSafeAreaInsets();

    const playerNumberOptions = [...Array.from(Array(MAX_PLAYERS).keys(), n => n + 1)];

    const menuActions: MenuAction[] = playerNumberOptions.map((number) => ({
        id: number.toString(),
        title: number.toString() + (number == 1 ? ' Player' : ' Players'),
    }));

    const addGameHandler = async (playerCount: number) => {
        dispatch(
            asyncCreateGame({ gameCount, playerCount })
        ).then(() => {
            setTimeout(() => {
                navigation.navigate('EditGame', { source: 'new_game' });
            }, 500);
        });
    };

    const icon = <Icon name="plus" type="font-awesome-5" size={24} color="#FFFFFF" />;

    return (
        <View testID="add-game-button-container" style={[styles.container, {
            bottom: insets.bottom + FAB_BOTTOM_MARGIN,
            right: insets.right + FAB_EDGE_MARGIN,
        }]}>
            <MenuView
                style={StyleSheet.absoluteFill}
                onOpenMenu={() => {
                    Keyboard.dismiss();
                }}
                onPressAction={async ({ nativeEvent }) => {
                    Keyboard.dismiss();
                    const playerNumber = parseInt(nativeEvent.event);
                    addGameHandler(playerNumber);
                }}
                actions={menuActions}
            >
                {LIQUID_GLASS ? (
                    // Tinted rather than clear: the button has to stay findable
                    // while the games list scrolls under it, and the accent is
                    // what makes it findable.
                    //
                    // `isInteractive` even though the menu owns the press: the
                    // glass should pan under the finger on the way to opening
                    // the menu, the same as every other glass control here.
                    <GlassView
                        accessibilityLabel="Add game"
                        accessibilityRole="button"
                        isInteractive
                        style={styles.fab}
                        testID="add-game-button"
                        tintColor={theme.tint}
                    >
                        {icon}
                    </GlassView>
                ) : (
                    <View
                        accessibilityLabel="Add game"
                        accessibilityRole="button"
                        style={[styles.fab, styles.fabFlat, { backgroundColor: theme.tint }]}
                        testID="add-game-button"
                    >
                        {icon}
                    </View>
                )}
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
    /**
     * The glass is the shape, so the circle lives on the element that draws the
     * effect — a `borderRadius` set on an ancestor would leave the glass square.
     */
    fab: {
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    /** Glass lifts itself off the background; a flat disc needs the shadow to. */
    fabFlat: {
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 8,
    },
});

export default FloatingActionButton;
