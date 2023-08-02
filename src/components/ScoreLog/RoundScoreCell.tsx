import React, { memo } from 'react';
import { Text, StyleSheet } from 'react-native';
import { useAppSelector } from '../../../redux/hooks';

import { selectPlayerById } from '../../../redux/PlayersSlice';

interface Props {
    playerId: string;
    round: number;
    playerIndex: number;
}

const RoundScoreCell: React.FunctionComponent<Props> = ({ playerId, round, playerIndex }) => {
    const scores = useAppSelector(state =>
        selectPlayerById(state, playerId)?.scores
    );

    if (typeof scores == 'undefined') return null;

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
