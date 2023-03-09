import React, { useEffect, useRef, useState } from 'react';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { selectScoreByPlayerAndRound, selectScoreTotalByPlayer } from '../../redux/ScoreSelectors';
import { selectGameById } from '../../redux/GamesSlice';
import { selectPlayersByIds } from '../../redux/ScoreSelectors';
import { palette } from '../constants';
import { selectPlayerById } from '../../redux/PlayersSlice';

function Rounds({ navigation, show }) {
    const [roundScollOffset, setRoundScrollOffset] = useState(0);

    const currentGameId = useSelector(state => state.settings.currentGameId);
    const currentGame = useSelector(state => selectGameById(state, currentGameId));
    const roundCurrent = useSelector(state => selectGameById(state, currentGameId).roundCurrent);
    const roundTotal = useSelector(state => selectGameById(state, currentGameId).roundTotal);

    const players = useSelector(state => selectPlayersByIds(state, currentGame.playerIds));

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
        if (round != roundCurrent) {
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
                        >{player.playerName}</Text>
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
                    <PlayerTotal key={player.id} playerId={player.id} />
                ))}
            </View>
        )
    }

    const PlayerTotal = ({ playerId }) => {
        const scores = useSelector(state =>
            selectPlayerById(state, playerId).scores
        );

        const scoreTotal = scores.reduce(
            (sum, current, round) => {
                if (round > round) { return sum; }
                return (sum || 0) + (current || 0);
            }
        )

        return (
            <Text key={playerId} style={[styles.scoreEntry, { color: 'white', fontWeight: 'bold' }]} >
                {scoreTotal}
            </Text>
        )
    }

    const RoundColumn = ({ round }) => {
        return (
            <View style={{ padding: 10 }}
                ref={roundCurrent == round ? currentRoundEl : null}
                onLayout={(e) => onLayoutHandler(e, round)}
                backgroundColor={round == roundCurrent ? '#111' : 'black'}>
                <Text style={{
                    color: roundCurrent == round ? 'red' : 'yellow',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: 20,
                }}>
                    {round + 1}
                </Text>
                {players.map((player, playerIndex) => (
                    <PlayerRoundCell playerId={player.id} round={round} key={player.id} index={playerIndex} />
                ))}
            </View>
        );
    }

    const PlayerRoundCell = ({ playerId, round, playerIndex }) => {
        const scores = useSelector(state =>
            selectPlayerById(state, playerId).scores
        );

        const scoreRound = scores[round] || 0;

        return (
            <Text key={playerIndex} style={[
                styles.scoreEntry,
                { color: scoreRound == 0 ? '#555' : 'white' }]}>
                {scoreRound}
            </Text>
        )
    }

    const roundsIterator = [...Array(roundTotal + 1).keys()];

    return (
        <SafeAreaView edges={['right', 'left']} style={{ flexDirection: 'row', backgroundColor: 'black', paddingBottom: 10, height: show ? 'auto' : 0 }}>

            <PlayerNameColumn />

            <TotalColumn />

            <ScrollView
                horizontal={true}
                contentContainerStyle={{ flexDirection: 'row' }}
                ref={roundsScrollViewEl}
            >
                {roundsIterator.map((item, round) => (
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
