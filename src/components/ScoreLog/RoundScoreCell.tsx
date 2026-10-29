import React, { memo } from 'react';

import { StyleSheet, Text } from 'react-native';

import { useAppSelector } from '../../../redux/hooks';
import { selectPlayerScoreByRound } from '../../../redux/PlayersSlice';
import { useTheme } from '../../theme';

import { TABLE_CELL_PADDING, tableStyles } from './tableMetrics';

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
            tableStyles.cell,
            styles.scoreEntry,
            { color: scoreRound == 0 ? theme.textTertiary : theme.text, borderColor: theme.separator }]}>
            {scoreRound}
        </Text>
    );
};

const styles = StyleSheet.create({
    scoreEntry: {
        minWidth: 44,
        paddingHorizontal: TABLE_CELL_PADDING,
    }
});

export default memo(RoundScoreCell);
