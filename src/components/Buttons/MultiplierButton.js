import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Text, StyleSheet } from 'react-native';

import HeaderButton from './HeaderButton';
import { systemBlue } from '../../constants';
import { toggleMultiplier } from '../../../redux/SettingsSlice';

const MultiplierButton = (props) => {
    const dispatch = useDispatch();
    const multiplier = useSelector(state => state.settings.multiplier);

    const multiplierHandler = () => {
        dispatch(toggleMultiplier());
    };

    return (
        <HeaderButton onPress={multiplierHandler}>
            <Text style={styles.multiplierButton}>{multiplier} pt</Text>
        </HeaderButton>
    );
};

const styles = StyleSheet.create({
    multiplierButton: {
        color: systemBlue,
        fontSize: 20,
        fontVariant: ['tabular-nums'],
    },
});

export default MultiplierButton;
