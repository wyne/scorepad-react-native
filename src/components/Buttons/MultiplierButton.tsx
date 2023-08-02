import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import analytics from '@react-native-firebase/analytics';

import { useAppSelector, useAppDispatch } from '../../../redux/hooks';
import { systemBlue } from '../../constants';
import { toggleMultiplier } from '../../../redux/SettingsSlice';

const MultiplierButton: React.FunctionComponent = ({ }) => {
    const dispatch = useAppDispatch();
    const multiplier = useAppSelector(state => state.settings.multiplier);
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const multiplierHandler = async () => {
        dispatch(toggleMultiplier);
        await analytics().logEvent('multiplier_change', {
            multiplier: multiplier,
            game_id: currentGameId,
        });
    };

    return (
        <TouchableOpacity style={[styles.headerButton]} onPress={multiplierHandler}>
            <Text style={styles.multiplierButton}>{multiplier} pt</Text>
        </TouchableOpacity>
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

export default MultiplierButton;
