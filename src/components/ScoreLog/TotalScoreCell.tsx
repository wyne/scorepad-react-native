import React, { memo } from 'react';

import { Text , StyleSheet } from 'react-native';

import { useAppSelector } from '../../../redux/hooks';
import { selectPlayerById } from '../../../redux/PlayersSlice';
import { useTheme } from '../../theme';

export type Props = {
    playerId: string;
}
const TotalScoreCell: React.FunctionComponent<Props> = ({ playerId }) => {
    const theme = useTheme();
    const scores: number[] = useAppSelector(state => (selectPlayerById(state, playerId) || { scores: [] }).scores);
    const scoreTotal = scores.reduce((sum, current, round) => {
        if (round > round) {
            return sum;
        }
        return (sum || 0) + (current || 0);
    });
    return (
        <Text key={playerId} style={[styles.scoreEntry, { color: theme.text }]}>
            {scoreTotal}
        </Text>
    );
};

const styles = StyleSheet.create({
    totalHeader: {
        textAlign: 'center',
        fontSize: 20
    },
    scoreEntry: {
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
        fontSize: 20
    }
});
export default memo(TotalScoreCell);
