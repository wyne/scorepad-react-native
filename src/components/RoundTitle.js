import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSelector } from 'react-redux';

function RoundTitle({ navigation }) {
    const currentRound = useSelector(state => state.currentGame.currentRound);

    return (
        <SafeAreaView edges={['top']} style={[styles.title]}>
            <Text style={{ fontSize: 20, color: 'white' }}>Round {currentRound + 1}</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    title: {
        textAlign: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: 'black',
        paddingBottom: 5,
    }
});

export default RoundTitle;