import React, { useEffect, useRef, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { s, vs, ms, mvs } from 'react-native-size-matters';
import { Icon } from 'react-native-elements/dist/icons/Icon';

import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';

function Rounds({ navigation, show }) {
    const palette = ["01497c", "c25858", "f5c800", "275436", "dc902c", "62516a", "755647", "925561"];
    const [roundScollOffsets, setRoundScrollOffsets] = useState([]);

    const players = useSelector(state => state.currentGame.players);
    const scores = useSelector(state => state.currentGame.scores);
    const currentRound = useSelector(state => state.currentGame.currentRound);
    const currentRoundEl = useRef()
    const roundsScrollViewEl = useRef()

    useEffect(() => {
        roundsScrollViewEl.current.scrollTo({
            x: roundScollOffsets[currentRound],
            animated: Platform.OS == "ios" ? true : false
        })
    })

    const handleCurrentRoundLayout = (event, round) => {
        const offsets = [...roundScollOffsets];
        offsets[round] = event.nativeEvent.layout.x;
        setRoundScrollOffsets(offsets)
    }

    return (
        <SafeAreaView edges={['right', 'left']} style={{ flexDirection: 'row', backgroundColor: 'black', paddingBottom: 10, height: show ? 'auto' : 0 }}>

            <View style={{ padding: 10, color: 'white' }}>
                <Text style={{ color: 'white', fontSize: 20 }}> &nbsp; </Text>
                {players.map((player, index) => (
                    <View key={index} style={{ paddingLeft: 2, borderLeftWidth: 5, borderColor: "#" + palette[index] }}>
                        <Text key={index} style={{ color: 'white', maxWidth: 100, fontSize: 20, }}
                            numberOfLines={1}
                        >{player.name}</Text>
                    </View>
                ))}
            </View>

            <View key={'total'} style={{ padding: 10 }}>
                <Text style={[styles.totalHeader]}>
                    Total
                </Text>
                {players.map((player, playerIndex) => (
                    <Text key={playerIndex} style={[styles.scoreEntry, { color: 'white', fontWeight: 'bold' }]} >
                        {scores[playerIndex].reduce(
                            (a, b) => { return (a || 0) + (b || 0); }
                        )}
                    </Text>
                ))}
            </View>

            <ScrollView horizontal={true} contentContainerStyle={{ flexDirection: 'row' }} ref={roundsScrollViewEl}>
                {scores[0].map((item, round) => (
                    <View key={round} style={{ padding: 10 }}
                        ref={currentRound == round ? currentRoundEl : null}
                        onLayout={(e) => handleCurrentRoundLayout(e, round)}
                        backgroundColor={round == currentRound ? '#111' : 'black'}>
                        <Text style={{
                            color: currentRound == round ? 'red' : 'yellow',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            fontSize: 20,
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

            <View style={{ flexDirection: 'column', justifyContent: 'space-around', padding: 10 }}>
                <TouchableOpacity style={{ justifyContent: 'center' }}
                    onPress={() => { navigation.navigate("Configure") }}>
                    <Icon size={ms(30, .4)} color='#0a84ff' style={{ textAlign: 'center' }} name="cog" type="font-awesome-5" />
                    <Text style={{ color: '#0a84ff', fontWeight: 'bold' }}>Settings</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    totalHeader: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 20,
    },
    scoreEntry: {
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
        color: 'white',
        fontSize: 20,
    }
});

export default Rounds;