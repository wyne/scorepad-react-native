import React from 'react';

import { Text, View, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements/dist/icons/Icon';

import { selectGameById, selectSortedPlayers } from '../../../redux/GamesSlice';
import { useAppSelector } from '../../../redux/hooks';
import { palette, systemBlue } from '../../constants';

const PlayerNameColumn: React.FunctionComponent = ({ }) => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(state => selectGameById(state, currentGameId));

    if (currentGame == undefined) return null;

    const players = useAppSelector(selectSortedPlayers);

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
                <View key={index} style={{ paddingLeft: 5, borderLeftWidth: 5, borderColor: "#" + palette[index % palette.length] }}>
                    <Text key={index} style={{ color: 'white', maxWidth: 100, fontSize: 20, }}
                        numberOfLines={1}
                    >{player.playerName}</Text>
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
