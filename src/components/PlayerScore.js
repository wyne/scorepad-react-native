import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { incPlayerRoundScore, decPlayerRoundScore } from '../../store/actions/ScoresActions';

function PlayerScore({ playerIndex, color }) {
    const scores = useSelector(state => state.scores);
    const players = useSelector(state => state.players);

    const dispatch = useDispatch();

    const incPlayerRoundScoreHandler = () => {
        dispatch(incPlayerRoundScore(playerIndex));
    }

    const decPlayerRoundScoreHandler = () => {
        dispatch(decPlayerRoundScore(playerIndex));
    }

    return (
        <View style={{ flexGrow: 1, justifyContent: 'center', alignContent: 'stretch', backgroundColor: '#' + color }}>
            <Text style={[styles.name]}>
                {players.players[playerIndex]}
            </Text>
            <View>
                <Text style={styles.score}>{scores[playerIndex].reduce((a, b) => { return (a || 0) + (b || 0); })}</Text>
                <View style={{
                    padding: 5,
                    borderRadius: 5,
                    borderWidth: 2,
                    borderColor: 'white',
                    alignSelf: 'center',
                    opacity: 0.7,
                }}>
                    <Text style={[styles.score, styles.roundScore]}>{scores[playerIndex][scores.currentRound] || 0}</Text>
                    <Text style={[styles.label, styles.roundLabel]}>Round {scores.currentRound + 1}</Text>
                </View>
            </View>

            <TouchableOpacity style={[styles.surface, styles.surfaceAdd]}
                onPress={incPlayerRoundScoreHandler}
            />
            <TouchableOpacity style={[styles.surface, styles.surfaceSubtract]}
                onPress={decPlayerRoundScoreHandler}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    surface: {
        position: 'absolute',
        width: '100%',
    },
    surfaceAdd: {
        top: 0,
        bottom: '50%',
    },
    surfaceSubtract: {
        top: '50%',
        bottom: 0,
    },
    name: {
        color: 'white',
        fontSize: 50,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    score: {
        margin: 2,
        marginTop: 15,
        fontSize: 90,
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'white',
        fontVariant: ['tabular-nums'],
    },
    roundScore: {
        opacity: .7,
        fontSize: 40,
        margin: 0,
        marginTop: 0,
        padding: 0,
    },
    label: {
        textAlign: 'center',
        color: 'white',
    },
    roundLabel: {
        opacity: .7,
        fontVariant: ['tabular-nums'],
    },
});

export default PlayerScore;