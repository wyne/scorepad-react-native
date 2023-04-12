import React, { memo } from 'react';
import { Text } from 'react-native';
import { useSelector } from 'react-redux';
import { selectPlayerById } from '../../../redux/PlayersSlice';
import { StyleSheet } from 'react-native';

const TotalScoreCell = ({ playerId }) => {
    const scores = useSelector(state => selectPlayerById(state, playerId).scores);
    const scoreTotal = scores.reduce((sum, current, round) => {
        if (round > round) {
            return sum;
        }
        return (sum || 0) + (current || 0);
    });
    return (
        <Text key={playerId} style={[styles.scoreEntry, { color: 'white', fontWeight: 'bold' }]}>
            {scoreTotal}
        </Text>
    );
};

const styles = StyleSheet.create({
    totalHeader: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 20
    },
    scoreEntry: {
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
        color: 'white',
        fontSize: 20
    }
});
export default memo(TotalScoreCell);
