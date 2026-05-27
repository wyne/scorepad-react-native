import React, { memo } from 'react';

import { StyleSheet, Text } from 'react-native';

import { useAppSelector } from '../../../redux/hooks';
import { selectPlayerScoreByRound } from '../../../redux/PlayersSlice';
import { useTheme } from '../../theme';

interface Props {
    playerId: string;
    round: number;
    playerIndex: number;
}

const RoundScoreCell: React.FunctionComponent<Props> = ({ playerId, round, playerIndex }) => {
    const theme = useTheme();
    const scoreRound = useAppSelector(state => selectPlayerScoreByRound(state, playerId, round));

    return (
        <Text key={playerIndex} style={[
            styles.scoreEntry,
            { color: scoreRound == 0 ? theme.textTertiary : theme.text }]}>
            {scoreRound}
        </Text>
    );
};

const styles = StyleSheet.create({
    totalHeader: {
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 20,
    },
    scoreEntry: {
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
        fontSize: 20,
    }
});

export default memo(RoundScoreCell);
