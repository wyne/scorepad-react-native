import React, { useEffect, useRef, useState } from 'react';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { selectScoreByPlayerAndRound, selectScoreTotalByPlayer } from '../../redux/ScoreSelectors';
import { palette } from '../constants';

function Rounds({ navigation, show }) {
    const [roundScollOffset, setRoundScrollOffset] = useState(0);

    const players = useSelector(state => state.currentGame.players);
    const scores = useSelector(state => state.currentGame.scores);
    const currentRound = useSelector(state => state.currentGame.currentRound);
    const totalRounds = useSelector(state => state.currentGame.totalRounds);
    const currentRoundEl = useRef()
    const roundsScrollViewEl = useRef()

    useEffect(() => {
        if (roundScollOffset !== undefined) {
            roundsScrollViewEl.current.scrollTo({
                x: roundScollOffset,
                animated: Platform.OS == "ios" ? true : false
            })
        }
    }, [roundScollOffset]);

    const onLayoutHandler = (event, round) => {
        if (round != currentRound) {
            return;
        }
        const offset = event.nativeEvent.layout.x;
        setRoundScrollOffset(offset);
    }

    const PlayerNameColumn = () => {
        return (
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
        );
    }

    const TotalColumn = ({ }) => {
        return (
            <View key={'total'} style={{ padding: 10 }}>
                <Text style={[styles.totalHeader]}>
                    Total
                </Text>
                {players.map((player, playerIndex) => (
                    <PlayerTotal key={playerIndex} playerIndex={playerIndex} />
                ))}
            </View>
        )
    }

    const PlayerTotal = ({ playerIndex }) => {
        const scoreTotal = useSelector(state =>
            selectScoreTotalByPlayer(state, playerIndex)
        );

        return (
            <Text key={playerIndex} style={[styles.scoreEntry, { color: 'white', fontWeight: 'bold' }]} >
                {scoreTotal}
            </Text>
        )
    }

    const RoundColumn = ({ round }) => {
        return (
            <View style={{ padding: 10 }}
                ref={currentRound == round ? currentRoundEl : null}
                onLayout={(e) => onLayoutHandler(e, round)}
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
                    <PlayerRoundCell playerIndex={playerIndex} round={round} key={playerIndex} />
                ))}
            </View>
        );
    }

    const PlayerRoundCell = ({ playerIndex, round }) => {
        const scoreRound = useSelector(state =>
            selectScoreByPlayerAndRound(state, playerIndex, round)
        );

        return (
            <Text key={playerIndex} style={[
                styles.scoreEntry,
                { color: scoreRound == 0 ? '#555' : 'white' }]}>
                {scoreRound}
            </Text>
        )
    }

    return (
        <SafeAreaView edges={['right', 'left']} style={{ flexDirection: 'row', backgroundColor: 'black', paddingBottom: 10, height: show ? 'auto' : 0 }}>

            <PlayerNameColumn />

            <TotalColumn />

            <ScrollView
                horizontal={true}
                contentContainerStyle={{ flexDirection: 'row' }}
                ref={roundsScrollViewEl}
            >
                {scores[0].map((item, round) => (
                    <RoundColumn round={round} key={round} />
                ))}
            </ScrollView>

            <View flexDirection='column' style={{ justifyContent: 'space-around', padding: 15 }}>
                <TouchableOpacity onPress={() => { navigation.navigate("Settings") }} >
                    {show && <Icon size={30} color='#0a84ff' style={{ textAlign: 'center' }} name="people" />}
                    {show && <Text style={{ color: '#0a84ff', fontWeight: 'bold' }}>Setup</Text>}
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
