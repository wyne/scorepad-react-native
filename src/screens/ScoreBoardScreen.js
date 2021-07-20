import React, { useState } from 'react';
import { Text, View, StyleSheet, Platform, ScrollView, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import PlayerScore from '../components/PlayerScore'
import Rounds from '../components/Rounds';
import { useSelector } from 'react-redux';

export default function ScoreBoardScreen({ navigation }) {
    // https://coolors.co/f4f1de-e07a5f-8f5d5d-3d405b-5f797b-81b29a-babf95-f2cc8f
    const palette = ["7d9cd4", "de8383", "a4d4a7", "c188d1", "a4d4a7", "c188d1", "de8383"];
    // const palette = ["e07a5f", "8f5d5d", "3d405b", "5f797b", "81b29a", "babf95", "f2cc8f"]

    const [currentRound, setCurrentRound] = useState(0);

    const players = useSelector(state => state.players);

    const [scoreMatrix, setScoreMatrix] = useState(
        Array.from({ length: players.length }, () => Array.from({ length: 1 }, () => 0))
    );

    const updatePlayerRoundScore = (playerIndex, round, score) => {
        let copy = [...scoreMatrix];
        copy[playerIndex][round] = score
        setScoreMatrix(copy);
    };

    const setRound = (newRound) => {
        if (scoreMatrix[0][newRound] === undefined) {
            let copy = [...scoreMatrix];
            players.forEach((name, index) => {
                copy[index][newRound] = 0;
            })
            setScoreMatrix(copy);
        }
        if (newRound < 0) { return }
        setCurrentRound(newRound);
    }

    return (
        <View style={styles.appContainer}>
            <View style={styles.contentStyle}>
                {players.map((name, index) => (
                    <PlayerScore
                        name={name}
                        playerIndex={index}
                        color={palette[index % palette.length]}
                        round={currentRound}
                        roundScore={scoreMatrix[index][currentRound] || 0}
                        totalScore={scoreMatrix[index].reduce((a, b) => { return (a || 0) + (b || 0); })}
                        onScoreChange={(changedPlayerIndex, score) => {
                            updatePlayerRoundScore(changedPlayerIndex, currentRound, score);
                        }}
                        key={index}
                    />
                ))}
            </View>
            <Rounds
                style={styles.footerStyle}
                scoreMatrix={scoreMatrix}
                currentRound={currentRound}
                navigation={navigation}
                onRoundChange={newRound => setRound(newRound)} />
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

