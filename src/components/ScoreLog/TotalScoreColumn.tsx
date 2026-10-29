import React, { memo } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { useAppSelector } from '../../../redux/hooks';
import { selectCurrentGame } from '../../../redux/selectors';
import { useTheme } from '../../theme';

import { SortDirectionKey, SortSelectorKey, sortSelectors } from './SortHelper';
import { TABLE_RULE_WIDTH, tableStyles } from './tableMetrics';
import TotalScoreCell from './TotalScoreCell';

const TotalScoreColumn: React.FunctionComponent = () => {
    const theme = useTheme();
    const sortKey = useAppSelector(state => selectCurrentGame(state)?.sortSelectorKey);

    const sortSelector = sortSelectors[sortKey || SortSelectorKey.ByIndex];
    const sortedPlayerIds = useAppSelector(sortSelector);

    const sortDirection = useAppSelector(state => selectCurrentGame(state)?.sortDirectionKey);

    let sortLabel = '';
    if (sortKey === SortSelectorKey.ByScore && sortDirection === SortDirectionKey.Normal) {
        sortLabel = '↓';
    } else if (sortKey === SortSelectorKey.ByScore && sortDirection === SortDirectionKey.Reversed) {
        sortLabel = '↑';
    }

    return (
        <View key={'total'} style={[styles.column, { borderColor: theme.separator }]}>
            <Text style={[tableStyles.header, styles.header, { color: theme.textSecondary }]}>
                Total {sortLabel}
            </Text>
            {sortedPlayerIds.map((playerId) => (
                <TotalScoreCell key={playerId} playerId={playerId} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    // Rules either side set the frozen columns apart from the rounds.
    column: {
        borderLeftWidth: TABLE_RULE_WIDTH,
        borderRightWidth: TABLE_RULE_WIDTH,
    },
    header: {
        paddingHorizontal: 10,
    },
});

export default memo(TotalScoreColumn);
