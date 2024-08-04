import React from 'react';

import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import { useAppSelector } from '../../../redux/hooks';
import { logEvent } from '../../Analytics';
import { systemBlue } from '../../constants';
import { InteractionType } from '../Interactions/InteractionType';
import { useAddendModalContext } from '../Sheets/AddendModalContext';
import { useGameSheetContext } from '../Sheets/GameSheetContext';

import SwipeGestureIcon from './SwipeGestureIcon';
import TapGestureIcon from './TapGestureIcon';

const AddendButton: React.FunctionComponent = ({ }) => {
    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);
    const interactionType = useAppSelector(state => state.settings.interactionType);
    const installId = useAppSelector(state => state.settings.installId);

    const adddendModalRef = useAddendModalContext();
    const gameSheetRef = useGameSheetContext();

    const handlePress = () => {
        if (adddendModalRef == null) {
            return;
        }

        gameSheetRef?.current?.snapToIndex(0);
        adddendModalRef.current?.present();

        logEvent('addend_sheet', {
            installId
        });
    };

    const gestureIcons: { [key: string]: React.FunctionComponent; } = {
        [InteractionType.HalfTap]: TapGestureIcon,
        [InteractionType.SwipeVertical]: SwipeGestureIcon,
    };

    const GestureIcon = gestureIcons[interactionType] || TapGestureIcon;

    return (
        <TouchableHighlight onPress={handlePress}>
            <View style={styles.button}>
                <Text style={styles.buttonText} allowFontScaling={false}>{addendOne}, {addendTwo}</Text>
                <GestureIcon />
            </View>
        </TouchableHighlight>
    );
};

const styles = StyleSheet.create({
    button: {
        padding: 10,
        paddingVertical: 5,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 20,
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
        color: systemBlue,
    },
});

export default AddendButton;
