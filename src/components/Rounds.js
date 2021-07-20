import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';

import { Feather } from '@expo/vector-icons';
import { EvilIcons } from '@expo/vector-icons';

function Rounds({ scoreMatrix, currentRound, onRoundChange, navigation }) {
    const players = useSelector(state => state.players);

    return (
        <View style={{ flexDirection: 'row', backgroundColor: 'black' }}>

            <TouchableOpacity
                style={{ justifyContent: 'center', }}
                onPress={() => { onRoundChange(currentRound - 1); }} >
                <View><Text>
                    <Feather name="chevron-left" style={styles.roundButton} color="black" />
                </Text></View>
            </TouchableOpacity>

            <TouchableOpacity style={{ justifyContent: 'center' }}
                onPress={() => { navigation.navigate("Configure") }}>
                <EvilIcons style={{ fontSize: 50, color: 'white', textAlign: 'center' }} name="gear" color="black" />
            </TouchableOpacity>

            <View style={{ padding: 10, color: 'white' }}>
                <Text style={{ color: 'white' }}>
                    &nbsp;
                </Text>
                {players.map((name, index) => (
                    <Text key={index} style={{ color: 'white' }}>{name}</Text>
                ))}
            </View>

            <ScrollView horizontal={true} contentContainerStyle={{ flexDirection: 'row' }}>

                {scoreMatrix[0].map((item, round) => (
                    <View key={round} style={{ padding: 10 }}>
                        <Text style={{
                            color: currentRound == round ? 'red' : 'white',
                            fontWeight: 'bold',
                            opacity: .6,
                            textAlign: 'center',
                        }}>{round + 1}</Text>
                        {players.map((player, playerIndex) => (
                            <Text key={playerIndex} style={styles.scoreEntry}>
                                {scoreMatrix[playerIndex][round]}
                            </Text>
                        ))}
                    </View>
                ))}
            </ScrollView>

            <TouchableOpacity
                style={{ justifyContent: 'center', }}
                onPress={() => { onRoundChange(currentRound + 1); }} >
                <View>
                    <Feather name="chevron-right" style={styles.roundButton} color="black" />
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    roundButton: {
        fontSize: 50,
        paddingHorizontal: 10,
        color: 'white',
    },
    scoreEntry: {
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
        color: 'white',
    }
});

export default Rounds;