import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import analytics from '@react-native-firebase/analytics';

import { systemBlue } from '../../constants';
import { toggleMultiplier } from '../../../redux/SettingsSlice';

const MultiplierButton = (props) => {
    const dispatch = useDispatch();
    const multiplier = useSelector(state => state.settings.multiplier);
    const currentGameId = useSelector(state => state.settings.currentGameId);

    const multiplierHandler = async () => {
        dispatch(toggleMultiplier());
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
