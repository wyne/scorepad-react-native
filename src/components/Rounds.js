import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

import { useSelector, useDispatch } from 'react-redux';
import { nextRound, prevRound } from '../../redux/CurrentGameActions';

import { Feather } from '@expo/vector-icons';
import { EvilIcons } from '@expo/vector-icons';

function Rounds({ navigation }) {
    const dispatch = useDispatch();

    const nextRoundHandler = () => {
        dispatch(nextRound());
    }

    const prevRoundHandler = () => {
        dispatch(prevRound());
    }

    const players = useSelector(state => state.currentGame.players);
    const scores = useSelector(state => state.currentGame.scores);
    const currentRound = useSelector(state => state.currentGame.currentRound);

    return (
        <View style={{ flexDirection: 'row', backgroundColor: 'black' }}>

            <TouchableOpacity
                style={{ justifyContent: 'center' }}
                onPress={prevRoundHandler} >
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
                {players.map((player, index) => (
                    <Text key={index} style={{ color: 'white' }}>{player.name}</Text>
                ))}
            </View>

            <ScrollView horizontal={true} contentContainerStyle={{ flexDirection: 'row' }}>

                {scores[0].map((item, round) => (
                    <View key={round} style={{ padding: 10 }}>
                        <Text style={{
                            color: currentRound == round ? 'red' : 'white',
                            fontWeight: 'bold',
                            opacity: .6,
                            textAlign: 'center',
                        }}>{round + 1}</Text>
                        {players.map((player, playerIndex) => (
                            <Text key={playerIndex} style={styles.scoreEntry}>
                                {scores[playerIndex][round]}
                            </Text>
                        ))}
                    </View>
                ))}
            </ScrollView>

            <TouchableOpacity
                style={{ justifyContent: 'center', }}
                onPress={nextRoundHandler} >
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