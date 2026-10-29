import React, { memo } from 'react';

import { Text, StyleSheet } from 'react-native';

import { useAppSelector } from '../../../redux/hooks';
import { selectPlayerGrandTotalScore } from '../../../redux/PlayersSlice';
import { useTheme } from '../../theme';

import { TABLE_CELL_PADDING, tableStyles } from './tableMetrics';

export type Props = {
    playerId: string;
}
const TotalScoreCell: React.FunctionComponent<Props> = ({ playerId }) => {
    const theme = useTheme();
    const scoreTotal = useAppSelector(state => selectPlayerGrandTotalScore(state, playerId));
    return (
        <Text key={playerId}
            style={[tableStyles.cell, styles.scoreEntry, { color: theme.text, borderColor: theme.separator }]}>
            {scoreTotal}
        </Text>
    );
};

const styles = StyleSheet.create({
    scoreEntry: {
        fontWeight: '600',
        paddingHorizontal: TABLE_CELL_PADDING,
    }
});
export default memo(TotalScoreCell);
