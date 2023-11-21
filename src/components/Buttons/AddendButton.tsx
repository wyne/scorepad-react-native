import React from 'react';

import { Text, View, StyleSheet, TouchableHighlight } from 'react-native';

import { useAppSelector } from '../../../redux/hooks';
import { systemBlue } from '../../constants';
import { useAddendModalContext } from '../Sheets/AddendModalContext';
import { useGameSheetContext } from '../Sheets/GameSheetContext';

const AddendButton: React.FunctionComponent = ({ }) => {
    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);

    const adddendModalRef = useAddendModalContext();
    const gameSheetRef = useGameSheetContext();

    const handlePress = () => {
        if (adddendModalRef == null) {
            return;
        }

        gameSheetRef?.current?.snapToIndex(0);
        adddendModalRef.current?.present();
    };

    return (
        <TouchableHighlight onPress={handlePress}>
            <View style={styles.button}>
                <Text style={styles.buttonText}>{addendOne}, {addendTwo}</Text>
            </View>
        </TouchableHighlight>
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

export default AddendButton;
