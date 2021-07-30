import React, { useEffect, useRef } from 'react';
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
    const currentRoundEl = useRef()
    const roundsScrollViewEl = useRef()

    useEffect(() => {
        currentRoundEl.current.measure((ox, oy, width, height, px, py) => {
            roundsScrollViewEl.current.scrollTo({ x: ox, animated: true })
        })
    })

    return (
        <View style={{ flexDirection: 'row', backgroundColor: 'black', paddingBottom: 10 }}>

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
                <Text style={{ color: 'white' }}> &nbsp; </Text>
                {players.map((player, index) => (
                    <Text key={index} style={{ color: 'white', maxWidth: 100, }}
                        numberOfLines={1}
                    >{player.name}</Text>
                ))}
            </View>

            <ScrollView horizontal={true} contentContainerStyle={{ flexDirection: 'row' }} ref={roundsScrollViewEl}>
                {scores[0].map((item, round) => (
                    <View key={round} style={{ padding: 10 }}
                        ref={currentRound == round ? currentRoundEl : null}
                        backgroundColor={round == currentRound ? '#111' : 'black'}>
                        <Text style={{
                            color: currentRound == round ? 'red' : 'yellow',
                            fontWeight: 'bold',
                            textAlign: 'center',
                        }}>
                            {round + 1}
                        </Text>
                        {players.map((player, playerIndex) => (
                            <Text key={playerIndex} style={[
                                styles.scoreEntry,
                                { color: scores[playerIndex][round] == 0 ? '#555' : 'white' }]}>
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