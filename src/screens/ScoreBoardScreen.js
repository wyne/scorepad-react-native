import React, { Component, useState } from 'react';
import { Text, View, StyleSheet, Platform, ScrollView, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import PlayerScore from '../components/PlayerScore'
import Rounds from '../components/Rounds';
import { cloneDeep } from 'lodash';

export default function App() {
    // const palette = ["7d9cd4", "de8383", "a4d4a7", "c188d1", "a4d4a7", "c188d1", "de8383"];
    // https://coolors.co/f4f1de-e07a5f-8f5d5d-3d405b-5f797b-81b29a-babf95-f2cc8f
    const palette = ["e07a5f", "8f5d5d", "3d405b", "5f797b", "81b29a", "babf95", "f2cc8f"]

    const [currentRound, setCurrentRound] = useState(0);
    const [scores, setScores] = useState({
        'Player 1': [0],
        'Player 2': [0],
        'Player 3': [0],
        'Player 4': [0],
        // 'Player 5': [0],
        // 'Player 6': [0],
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

    return (
        <View style={styles.appContainer}>
            <View style={styles.contentStyle}>
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
            </View>
            <Rounds
                style={styles.footerStyle}
                scores={scores}
                currentRound={currentRound}
                onRoundChange={newRound => updateRound(newRound)} />
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
    },
    footerStyle: {
        flex: 1,
    }
});

