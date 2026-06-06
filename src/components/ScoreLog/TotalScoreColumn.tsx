import React, { memo } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { useAppSelector } from '../../../redux/hooks';
import { selectCurrentGame } from '../../../redux/selectors';
import { useTheme } from '../../theme';

import { SortDirectionKey, SortSelectorKey, sortSelectors } from './SortHelper';
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
        <View key={'total'} style={{ padding: 10 }}>
            <Text style={[styles.totalHeader, { color: theme.text }]}>
                Total {sortLabel}
            </Text>
            {sortedPlayerIds.map((playerId) => (
                <TotalScoreCell key={playerId} playerId={playerId} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    totalHeader: {
        textAlign: 'center',
        fontSize: 20,
    }
});

export default memo(TotalScoreColumn);
