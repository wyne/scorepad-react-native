import React, { Component, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function Rounds({ scores, currentRound, onRoundChange }) {
    const players = Object.keys(scores);
    const totalRounds = scores[players[0]].length;

    return (
        <View style={{ flexDirection: 'row', backgroundColor: 'black' }}>

            <TouchableOpacity
                style={{ justifyContent: 'center', }}
                onPress={() => { onRoundChange(currentRound - 1); }} >
                <View><Text>
                    <Ionicons name="caret-back-circle-outline" style={styles.roundButton} color="black" />
                </Text></View>
            </TouchableOpacity>

            <View style={{ padding: 10, color: 'white' }}>
                <Text style={{ color: 'white' }}>&nbsp;</Text>
                {players.map((name, index) => (
                    <Text key={index} style={{ color: 'white' }}>{name}</Text>
                ))}
            </View>

            <ScrollView horizontal={true} contentContainerStyle={{ flexDirection: 'row' }}>

                {scores[players[0]].map((item, round) => (
                    <View key={round} style={{ padding: 10 }}>
                        <Text style={{
                            color: currentRound == round ? 'red' : 'white',
                            fontWeight: 'bold',
                            opacity: .6,
                            textAlign: 'center',
                        }}>{round + 1}</Text>
                        {players.map((player, playerIndex) => (
                            <Text key={playerIndex} style={{ color: 'white', textAlign: 'center' }}>
                                {scores[player][round]}
                            </Text>
                        ))}
                    </View>
                ))}
            </ScrollView>

            <TouchableOpacity
                style={{ justifyContent: 'center', }}
                onPress={() => { onRoundChange(currentRound + 1); }} >
                <View>
                    <Ionicons name="caret-forward-circle-outline" style={styles.roundButton} color="black" />
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
    }
});

export default Rounds;