import React from 'react';

import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';

import { selectPlayerColors } from '../../../redux/GamesSlice';
import { useAppSelector } from '../../../redux/hooks';
import { selectPlayerById } from '../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../redux/selectors';

import { SortSelector, SortSelectorKey } from './SortHelper';


interface Props {
    sortSelector: SortSelector;
    sortSelectorKey: SortSelectorKey;
}

interface CellProps {
    index: number;
    playerId: string;
}

const PlayerNameCell: React.FunctionComponent<CellProps> = ({ index, playerId }) => {
    const currentGameId = useAppSelector(state => selectCurrentGame(state)?.id);
    const playerColors = useAppSelector(state => selectPlayerColors(state, currentGameId || '', index || 0));
    const playerName = useAppSelector(state => selectPlayerById(state, playerId)?.playerName);

    return (
        <View key={index} style={{ paddingLeft: 5, borderLeftWidth: 5, borderColor: playerColors[0] }}>
            <Text key={index} style={{ color: 'white', maxWidth: 100, fontSize: 20, }}
                numberOfLines={1}
            >{playerName}</Text>
        </View>
    );
};

const PlayerNameColumn: React.FunctionComponent<Props> = ({ sortSelector, sortSelectorKey }) => {
    const sortedPlayerIds = useAppSelector(sortSelector);

    return (
        <View style={{ paddingVertical: 10 }}>
            <Text style={styles.editRow}>
                &nbsp;
                <Icon name="users"
                    type="font-awesome-5"
                    size={19}
                    color='white' /> {
                    sortSelectorKey == SortSelectorKey.ByIndex ? '↓' : ''
                }
            </Text>
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
