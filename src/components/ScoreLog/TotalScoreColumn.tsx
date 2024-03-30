import React from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { useAppSelector } from '../../../redux/hooks';
import { selectCurrentGame } from '../../../redux/selectors';
import { RootState } from '../../../redux/store';

import { SortSelectorKey } from './SortHelper';
import TotalScoreCell from './TotalScoreCell';

interface Props {
    sortSelector: (state: RootState) => string[];
    sortSelectorKey: SortSelectorKey;
}

const TotalScoreColumn: React.FunctionComponent<Props> = ({ sortSelector, sortSelectorKey }) => {
    const currentGame = useAppSelector(selectCurrentGame);

    if (typeof currentGame == 'undefined') return null;

    const sortedPlayerIds = useAppSelector(sortSelector);

    return (
        <View key={'total'} style={{ padding: 10 }}>
            <Text style={[styles.totalHeader]}>
                Total {
                    sortSelectorKey == SortSelectorKey.ByScore ? '↓' : ''
                }
            </Text>
            {sortedPlayerIds.map((playerId) => (
                <TotalScoreCell key={playerId} playerId={playerId} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    totalHeader: {
        color: 'white',
        textAlign: 'center',
        fontSize: 20,
    }
});

export default TotalScoreColumn;
