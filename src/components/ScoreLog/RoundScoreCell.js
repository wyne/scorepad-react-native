import React, { useEffect, useRef, useState, memo } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { selectGameById } from '../../../redux/GamesSlice';
import { selectPlayersByIds } from '../../../redux/ScoreSelectors';
import { palette } from '../../constants';
import { selectPlayerById } from '../../../redux/PlayersSlice';

const RoundScoreCell = ({ playerId, round, playerIndex }) => {
    const scores = useSelector(state =>
        selectPlayerById(state, playerId).scores
    );

    const scoreRound = scores[round] || 0;

    return (
        <Text key={playerIndex} style={[
            styles.scoreEntry,
            { color: scoreRound == 0 ? '#555' : 'white' }]}>
            {scoreRound}
        </Text>
    )
}

const styles = StyleSheet.create({
    totalHeader: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 20,
    },
    scoreEntry: {
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
        color: 'white',
        fontSize: 20,
    }
});

export default memo(RoundScoreCell);
