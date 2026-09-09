import React from 'react';

import { Button, Host, Image, Menu } from '@expo/ui/swift-ui';
import { buttonStyle, contentShape, frame, glassEffect, shapes } from '@expo/ui/swift-ui/modifiers';
import { MenuAction, MenuView } from '@react-native-menu/menu';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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

const playerCountLabel = (count: number) => `${count}${count == 1 ? ' Player' : ' Players'}`;

const FloatingActionButton: React.FunctionComponent<Props> = ({ navigation }) => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const gameCount = useAppSelector(state => selectGameIds(state).length);
    const insets = useSafeAreaInsets();

    const playerNumberOptions = [...Array.from(Array(MAX_PLAYERS).keys(), n => n + 1)];

    const menuActions: MenuAction[] = playerNumberOptions.map((number) => ({
        id: number.toString(),
        title: playerCountLabel(number),
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

    const selectPlayerCount = (playerCount: number) => {
        Keyboard.dismiss();
        addGameHandler(playerCount);
    };

    return (
        <View testID="add-game-button-container" style={[styles.container, {
            bottom: insets.bottom + FAB_BOTTOM_MARGIN,
            right: insets.right + FAB_EDGE_MARGIN,
        }]}>
            {LIQUID_GLASS ? (
                // SwiftUI owns the whole control here, which is the point.
                // MenuView's anchor is a UIButton, and a UIControl consumes the
                // touch rather than passing it to subviews — so a GlassView
                // nested inside one never sees the touch-down that drives the
                // interactive glass. Inside SwiftUI the touch reaches the
                // label, so an interactive glass effect there responds.
                <Host style={StyleSheet.absoluteFill} testID="add-game-button">
                    <Menu
                        label={
                            // The glass goes on the label, sized by the frame
                            // ahead of it, so the circle is exactly FAB_SIZE.
                            // `.glassProminent` as a button style would instead
                            // wrap the glyph in the style's own padding and size
                            // itself, which is how this ended up much smaller
                            // than the disc it replaced.
                            <Image
                                systemName="plus"
                                size={24}
                                color="#FFFFFF"
                                modifiers={[
                                    frame({ width: FAB_SIZE, height: FAB_SIZE }),
                                    glassEffect({
                                        glass: { variant: 'regular', interactive: true, tint: theme.tint },
                                        shape: 'circle',
                                    }),
                                    // Without this the menu's dismissal morphs
                                    // back into the glyph's own bounds — a small
                                    // square — rather than the button. The
                                    // preview shape has to be stated separately
                                    // from the glass shape.
                                    contentShape(shapes.circle(), ['interaction', 'contextMenuPreview']),
                                ]}
                            />
                        }
                        modifiers={[buttonStyle('plain')]}
                    >
                        {playerNumberOptions.map((number) => (
                            <Button
                                key={number}
                                label={playerCountLabel(number)}
                                onPress={() => selectPlayerCount(number)}
                            />
                        ))}
                    </Menu>
                </Host>
            ) : (
                <MenuView
                    style={StyleSheet.absoluteFill}
                    onOpenMenu={() => {
                        Keyboard.dismiss();
                    }}
                    onPressAction={({ nativeEvent }) => {
                        selectPlayerCount(parseInt(nativeEvent.event));
                    }}
                    actions={menuActions}
                >
                    <View
                        accessibilityLabel="Add game"
                        accessibilityRole="button"
                        style={[styles.fab, { backgroundColor: theme.tint }]}
                        testID="add-game-button"
                    >
                        <Icon name="plus" type="font-awesome-5" size={24} color="#FFFFFF" />
                    </View>
                </MenuView>
            )}
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
    /** Glass lifts itself off the background; a flat disc needs the shadow to. */
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
