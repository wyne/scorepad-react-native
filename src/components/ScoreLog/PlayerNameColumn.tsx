import React, { memo, useMemo } from 'react';

import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';

import { makeSelectPlayerColors } from '../../../redux/GamesSlice';
import { useAppSelector } from '../../../redux/hooks';
import { selectPlayerById } from '../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../redux/selectors';
import { useTheme } from '../../theme';

import { SortDirectionKey, SortSelectorKey, sortSelectors } from './SortHelper';
import { TABLE_CELL_PADDING, TABLE_FONT_SIZE, TABLE_HEADER_HEIGHT, TABLE_ROW_HEIGHT, TABLE_RULE_WIDTH } from './tableMetrics';


interface CellProps {
    index: number;
    playerId: string;
}

const PlayerNameCell: React.FunctionComponent<CellProps> = ({ index, playerId }) => {
    const theme = useTheme();
    const selectPlayerColors = useMemo(() => makeSelectPlayerColors(), []);
    const currentGameId = useAppSelector(state => selectCurrentGame(state)?.id);
    const playerColors = useAppSelector(state => selectPlayerColors(state, currentGameId, playerId));
    const playerName = useAppSelector(state => selectPlayerById(state, playerId)?.playerName);

    return (
        <View key={index} style={[styles.cell, { borderColor: theme.separator }]}>
            <View style={[styles.colorBar, { backgroundColor: playerColors[0] }]} />
            <Text key={index} style={[styles.name, { color: theme.text }]}
                numberOfLines={1}
            >{playerName}</Text>
        </View>
    );
};

const PlayerHeaderCell: React.FunctionComponent = () => {
    const theme = useTheme();
    const sortKey = useAppSelector(state => selectCurrentGame(state)?.sortSelectorKey);
    const sortDirection = useAppSelector(state => selectCurrentGame(state)?.sortDirectionKey);

    let sortLabel = '';
    if (sortKey === SortSelectorKey.ByIndex && sortDirection === SortDirectionKey.Normal) {
        sortLabel = '↓';
    } else if (sortKey === SortSelectorKey.ByIndex && sortDirection === SortDirectionKey.Reversed) {
        sortLabel = '↑';
    }

    return (

        <View style={styles.header}>
            <Icon name="users"
                type="font-awesome-5"
                size={14}
                color={theme.textSecondary} />
            {sortLabel !== '' &&
                <Text style={[styles.sortLabel, { color: theme.textSecondary }]}>{sortLabel}</Text>
            }
        </View>
    );
};

const MemoizedPlayerNameCell = React.memo(PlayerNameCell);

const PlayerNameColumn: React.FunctionComponent = () => {
    const sortKey = useAppSelector(state => selectCurrentGame(state)?.sortSelectorKey);
    const sortSelector = sortSelectors[sortKey || SortSelectorKey.ByIndex];
    const sortedPlayerIds = useAppSelector(sortSelector);

    return (
        <View>
            <PlayerHeaderCell />

            {sortedPlayerIds.map((playerId, index) => (
                playerId && <MemoizedPlayerNameCell key={index} index={index} playerId={playerId} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        height: TABLE_HEADER_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingHorizontal: TABLE_CELL_PADDING,
    },
    sortLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    cell: {
        height: TABLE_ROW_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingLeft: TABLE_CELL_PADDING,
        paddingRight: TABLE_CELL_PADDING,
        borderTopWidth: TABLE_RULE_WIDTH,
    },
    colorBar: {
        width: 4,
        height: 20,
        borderRadius: 2,
    },
    name: {
        fontSize: TABLE_FONT_SIZE,
        maxWidth: 90,
    },
});

export default memo(PlayerNameColumn);
