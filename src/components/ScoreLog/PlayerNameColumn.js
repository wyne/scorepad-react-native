import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { TouchableOpacity } from 'react-native';

import { palette, systemBlue } from '../../constants';
import { selectGameById } from '../../../redux/GamesSlice';
import { selectPlayersByIds } from '../../../redux/ScoreSelectors';
import { Icon } from 'react-native-elements/dist/icons/Icon';

const PlayerNameColumn = ({ navigation }) => {
    const currentGameId = useSelector(state => state.settings.currentGameId);
    const currentGame = useSelector(state => selectGameById(state, currentGameId));
    const players = useSelector(state => selectPlayersByIds(state, currentGame.playerIds));

    return (
        <TouchableOpacity style={{ padding: 10, borderWidth: 1, border: 'pink' }} onPress={() => {
            navigation.navigate("Settings");
        }}>
            <Text style={styles.editRow}>
                &nbsp;
                <Icon name="users"
                    type="font-awesome-5"
                    size={20}
                    color={systemBlue} />
            </Text>
            {players.map((player, index) => (
                <View key={index} style={{ paddingLeft: 2, borderLeftWidth: 5, borderColor: "#" + palette[index] }}>
                    <Text key={index} style={{ color: 'white', maxWidth: 100, fontSize: 20, }}
                        numberOfLines={1}
                    >{player.playerName}</Text>
                </View>
            ))}
        </TouchableOpacity>
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
