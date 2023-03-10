import React from 'react';
import { Text, View } from 'react-native';
import { palette } from '../../constants';

const PlayerNameColumn = ({ players }) => {
    return (
        <View style={{ padding: 10 }}>
            <Text style={{ color: 'white', fontSize: 20 }}> &nbsp; </Text>
            {players.map((player, index) => (
                <View key={index} style={{ paddingLeft: 2, borderLeftWidth: 5, borderColor: "#" + palette[index] }}>
                    <Text key={index} style={{ color: 'white', maxWidth: 100, fontSize: 20, }}
                        numberOfLines={1}
                    >{player.playerName}</Text>
                </View>
            ))}
        </View>
    );
}

export default PlayerNameColumn;
