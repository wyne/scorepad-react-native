import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native';
import analytics from '@react-native-firebase/analytics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';

import { useAppSelector } from '../../../redux/hooks';
import { palette, systemBlue } from '../../constants';
import { selectGameById } from '../../../redux/GamesSlice';
import { selectAllPlayers } from '../../../redux/PlayersSlice';
import { Icon } from 'react-native-elements/dist/icons/Icon';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    disabled?: boolean;
}

const PlayerNameColumn: React.FunctionComponent<Props> = ({ navigation, disabled = false }) => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(state => selectGameById(state, currentGameId));

    if (currentGame == undefined) return null;

    const players = useAppSelector(state => selectAllPlayers(state)
        .filter(player => currentGame.playerIds.includes(player.id))
    ).sort((a, b) => currentGame.playerIds.indexOf(a.id) - currentGame.playerIds.indexOf(b.id));

    return (
        <TouchableOpacity style={{ padding: 10 }} onPress={async () => {
            if (disabled) return;

            await analytics().logEvent('edit_game', {
                game_id: currentGameId
            });
            navigation.navigate("Settings");
        }}>
            <Text style={styles.editRow}>
                &nbsp;
                <Icon name="users"
                    type="font-awesome-5"
                    size={20}
                    color={disabled ? 'white' : systemBlue} />
            </Text>
            {players.map((player, index) => (
                <View key={index} style={{ paddingLeft: 2, borderLeftWidth: 5, borderColor: "#" + palette[index % palette.length] }}>
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
