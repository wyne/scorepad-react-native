import React, { memo } from 'react';

import { createSelector } from '@reduxjs/toolkit';
import { StyleSheet, Text, View } from 'react-native';

import { useAppSelector } from '../../../redux/hooks';
import { grandTotalScore } from '../../../redux/scoreUtils';
import { rankLabel, rankPlayers } from '../../../redux/ScoringRules';
import { selectCurrentGame } from '../../../redux/selectors';
import { RootState } from '../../../redux/store';
import { useTheme } from '../../theme';

import { SortSelectorKey, sortSelectors } from './SortHelper';

const selectCurrentGameRanks = createSelector(
    [
        (state: RootState) => selectCurrentGame(state),
        (state: RootState) => state.players.entities,
    ],
    (game, players) => rankPlayers(
        game?.scoring,
        (game?.playerIds ?? []).map(id => ({ id, total: grandTotalScore(players[id]?.scores) })),
    )
);

/**
 * The # column on the score sheet: each player's place under the game's
 * winner rule, in the same row order as the name column.
 */
const RankColumn: React.FunctionComponent = () => {
    const theme = useTheme();
    const sortKey = useAppSelector(state => selectCurrentGame(state)?.sortSelectorKey);
    const sortedPlayerIds = useAppSelector(sortSelectors[sortKey || SortSelectorKey.ByIndex]);
    const ranks = useAppSelector(selectCurrentGameRanks);

    return (
        <View style={styles.column} testID="rank-column">
            <Text style={[styles.cell, { color: theme.textSecondary }]}>#</Text>
            {sortedPlayerIds.map((playerId) => (
                <Text key={playerId} style={[styles.cell, { color: theme.textSecondary }]}
                    testID={`rank-cell-${playerId}`}>
                    {ranks[playerId] ? rankLabel(ranks[playerId]) : ''}
                </Text>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    column: {
        paddingVertical: 10,
        paddingLeft: 10,
        // Room between the place and the player's color bar.
        paddingRight: 8,
        minWidth: 44,
    },
    cell: {
        fontSize: 20,
        fontVariant: ['tabular-nums'],
        textAlign: 'right',
    },
});

export default memo(RankColumn);
