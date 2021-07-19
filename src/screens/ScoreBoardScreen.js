import React, { Component, useState } from 'react';
import { Text, View, StyleSheet, Platform, ScrollView, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import PlayerScore from '../components/PlayerScore'
import Rounds from '../components/Rounds';
import { cloneDeep } from 'lodash';

export default function App() {
    const palette = ["7d9cd4", "de8383", "a4d4a7", "c188d1", "a4d4a7", "7d9cd4", "c188d1", "de8383"];

    const [currentRound, setCurrentRound] = useState(0);
    const [scores, setScores] = useState({
        'Player 1': [0],
        'Player 2': [0]
    });
    const players = Object.keys(scores);


    const updatePlayerRoundScore = (name, round, score) => {
        const newScores = cloneDeep(scores);
        newScores[name][round] = score;
        setScores(newScores);
    };

    const updateRound = (newRound) => {
        if (scores[players[0]][newRound] === undefined) {
            const newScores = cloneDeep(scores);
            players.forEach((name) => {
                newScores[name][newRound] = 0;
            })
            setScores(newScores);
        }
        if (newRound < 0) { return }
        setCurrentRound(newRound);
    }

    return (<>
        <ScrollView contentContainerStyle={styles.container}>
            {players.map((item, index) => (
                <PlayerScore
                    name={item}
                    color={palette[index]}
                    round={currentRound}
                    roundScore={scores[item][currentRound] || 0}
                    totalScore={scores[item].reduce((a, b) => { return (a || 0) + (b || 0); })}
                    onScoreChange={(name, round, score) => {
                        updatePlayerRoundScore(name, round, score);
                    }}
                    key={index}
                />
            ))}
        </ScrollView>
        <Rounds
            scores={scores}
            currentRound={currentRound}
            onRoundChange={newRound => updateRound(newRound)} />
    </>);
}

const styles = StyleSheet.create({
    container: {
        // paddingTop: Constants.statusBarHeight,
        height: Platform.OS === 'web' ? '100vh' : '100%',
        flex: 1,
    },
});

