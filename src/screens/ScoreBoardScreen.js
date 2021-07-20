import React, { useState } from 'react';
import { Text, View, StyleSheet, } from 'react-native';
import PlayerScore from '../components/PlayerScore'
import Rounds from '../components/Rounds';
import { useDispatch, useSelector } from 'react-redux';

export default function ScoreBoardScreen({ navigation }) {
    // https://coolors.co/f4f1de-e07a5f-8f5d5d-3d405b-5f797b-81b29a-babf95-f2cc8f
    const palette = ["7d9cd4", "de8383", "a4d4a7", "c188d1", "a4d4a7", "c188d1", "de8383"];
    // const palette = ["e07a5f", "8f5d5d", "3d405b", "5f797b", "81b29a", "babf95", "f2cc8f"]

    const players = useSelector(state => state.players);

    return (
        <View style={styles.appContainer}>
            <View style={styles.contentStyle}>
                {players.map((name, index) => (
                    <PlayerScore
                        key={index}
                        playerIndex={index}
                        color={palette[index % palette.length]}
                    />
                ))}
            </View>
            <Rounds
                style={styles.footerStyle}
                navigation={navigation}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    appContainer: {
        // paddingTop: Constants.statusBarHeight,
        // height: Platform.OS === 'web' ? '100vh' : '100%',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        position: 'absolute',
    },
    contentStyle: {
        flex: 1,
        flexGrow: 1,
        flexWrap: 'wrap',
        alignContent: 'stretch',
        flexDirection: 'row',
    },
    footerStyle: {
        flex: 1,
    }
});

