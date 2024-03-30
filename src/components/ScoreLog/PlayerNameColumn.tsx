import React from 'react';

import { StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';

import { SortSelector } from '../../../redux/GamesSlice';
import { useAppSelector } from '../../../redux/hooks';
import { selectPlayersByIds } from '../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../redux/selectors';
import { RootState } from '../../../redux/store';
import { palette, systemBlue } from '../../constants';

interface Props {
    sortSelector: SortSelector;
}

const PlayerNameColumn: React.FunctionComponent<Props> = ({ sortSelector }) => {
    const currentGame = useAppSelector(selectCurrentGame);

    if (currentGame == undefined) return null;

    const sortedPlayerIds = useAppSelector(sortSelector);

    const players = useAppSelector((state: RootState) => selectPlayersByIds(state, sortedPlayerIds));

    if (players == undefined) return null;

    const getPlayerIndex = (playerId: string | undefined) => {
        if (playerId == undefined) return -1;
        const index = currentGame.playerIds.findIndex((id) => id === playerId);
        return index;
    };

    const playerColor = (playerId: string | undefined) => {
        return "#" + palette[getPlayerIndex(playerId) % palette.length];
    };

    return (
        <View style={{ paddingVertical: 10 }}>
            <Text style={styles.editRow}>
                &nbsp;
                <Icon name="users"
                    type="font-awesome-5"
                    size={19}
                    color='white' />
            </Text>

            {players.map((player, index) => (
                <View key={index} style={{ paddingLeft: 5, borderLeftWidth: 5, borderColor: playerColor(player?.id) }}>
                    <Text key={index} style={{ color: 'white', maxWidth: 100, fontSize: 20, }}
                        numberOfLines={1}
                    >{player?.playerName}</Text>
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    editRow: {
        color: systemBlue,
        fontSize: 20,
        textAlign: 'center',
    }
});

export default PlayerNameColumn;
