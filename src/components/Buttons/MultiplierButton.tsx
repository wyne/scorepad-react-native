import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import analytics from '@react-native-firebase/analytics';

import { useAppSelector, useAppDispatch } from '../../../redux/hooks';
import { systemBlue } from '../../constants';
import { setMultiplier } from '../../../redux/SettingsSlice';
import { MenuView, MenuAction } from '@react-native-menu/menu';

const MultiplierButton: React.FunctionComponent = ({ }) => {
    const dispatch = useAppDispatch();
    const multiplier = useAppSelector(state => state.settings.multiplier);
    const currentGameId = useAppSelector(state => state.settings.currentGameId);

    const addends = [1, 5, 10, 20, 50];

    const actions: MenuAction[] = addends.map(addend => {
        return {
            id: addend.toString(),
            title: `${addend} point${addend === 1 ? '' : 's'} per tap`,
            state: multiplier === addend ? 'on' : 'off',
        };
    });

    return (
        <MenuView
            onPressAction={async ({ nativeEvent }) => {
                dispatch(setMultiplier(parseInt(nativeEvent.event)));
                await analytics().logEvent('multiplier_change', {
                    multiplier: multiplier,
                    game_id: currentGameId,
                });
            }}
            actions={actions}>
            <View style={styles.button}>
                <Text style={styles.buttonText}>{multiplier} pt</Text>
            </View>
        </MenuView>
    );
};

const styles = StyleSheet.create({
    button: {
        padding: 10,
        paddingVertical: 5,
        wdith: 50,
        alignSelf: 'center',
    },
    buttonText: {
        fontSize: 20,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
        color: systemBlue,
    },
});

export default MultiplierButton;
