import React from 'react';

import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';

import { makeSelectPlayerColors } from '../../../redux/GamesSlice';
import { useAppSelector } from '../../../redux/hooks';
import { selectPlayerById } from '../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../redux/selectors';

import { SortDirectionKey, SortSelectorKey, sortSelectors } from './SortHelper';


interface CellProps {
    index: number;
    playerId: string;
}

const PlayerNameCell: React.FunctionComponent<CellProps> = ({ index, playerId }) => {
    const currentGameId = useAppSelector(state => selectCurrentGame(state)?.id);
    const selectPlayerColors = makeSelectPlayerColors();
    const playerColors = useAppSelector(state => selectPlayerColors(state, currentGameId || '', playerId));
    const playerName = useAppSelector(state => selectPlayerById(state, playerId)?.playerName);

    return (
        <View key={index} style={{ paddingLeft: 5, borderLeftWidth: 5, borderColor: playerColors[0] }}>
            <Text key={index} style={{ color: 'white', maxWidth: 100, fontSize: 20, }}
                numberOfLines={1}
            >{playerName}</Text>
        </View>
    );
};

const PlayerHeaderCell: React.FunctionComponent = () => {
    const sortKey = useAppSelector(state => selectCurrentGame(state)?.sortSelectorKey);
    const sortDirection = useAppSelector(state => selectCurrentGame(state)?.sortDirectionKey);

    let sortLabel = '';
    if (sortKey === SortSelectorKey.ByIndex && sortDirection === SortDirectionKey.Normal) {
        sortLabel = '↓';
    } else if (sortKey === SortSelectorKey.ByIndex && sortDirection === SortDirectionKey.Reversed) {
        sortLabel = '↑';
    }

    return (

        <Text style={styles.editRow}>
            &nbsp;
            <Icon name="users"
                type="font-awesome-5"
                size={19}
                color='white' /> {
                sortLabel
            }
        </Text>
    );
};


const PlayerNameColumn: React.FunctionComponent = () => {
    const sortKey = useAppSelector(state => selectCurrentGame(state)?.sortSelectorKey);

    const sortSelector = sortSelectors[sortKey || SortSelectorKey.ByIndex];
    const sortedPlayerIds = useAppSelector(sortSelector);

    return (
        <View style={{ paddingVertical: 10 }}>
            <PlayerHeaderCell />

            {sortedPlayerIds.map((playerId, index) => (
                playerId && <PlayerNameCell key={index} index={index} playerId={playerId} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    editRow: {
        color: 'white',
        fontSize: 20,
        textAlign: 'center',
    }
});

export default PlayerNameColumn;
