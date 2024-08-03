import React, { memo } from 'react';

import { StyleSheet, Text } from 'react-native';

import { useAppSelector } from '../../../redux/hooks';
import { selectPlayerScoreByRound } from '../../../redux/PlayersSlice';

interface Props {
    playerId: string;
    round: number;
    playerIndex: number;
}

const RoundScoreCell: React.FunctionComponent<Props> = ({ playerId, round, playerIndex }) => {
    const scoreRound = useAppSelector(state => selectPlayerScoreByRound(state, playerId, round));

    return (
        <Text key={playerIndex} style={[
            styles.scoreEntry,
            { color: scoreRound == 0 ? '#555' : 'white' }]}>
            {scoreRound}
        </Text>
    );
};

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
