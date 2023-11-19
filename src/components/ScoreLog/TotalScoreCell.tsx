import React, { memo } from 'react';
import { Text } from 'react-native';
import { selectPlayerById } from '../../../redux/PlayersSlice';
import { StyleSheet } from 'react-native';
import { useAppSelector } from '../../../redux/hooks';

export type Props = {
    playerId: string;
}
const TotalScoreCell: React.FunctionComponent<Props> = ({ playerId }) => {
    const scores: number[] = useAppSelector(state => (selectPlayerById(state, playerId) || { scores: [] }).scores);
    const scoreTotal = scores.reduce((sum, current, round) => {
        if (round > round) {
            return sum;
        }
        return (sum || 0) + (current || 0);
    });
    return (
        <Text key={playerId} style={[styles.scoreEntry, { color: 'white' }]}>
            {scoreTotal}
        </Text>
    );
};

const styles = StyleSheet.create({
    totalHeader: {
        color: 'white',
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
