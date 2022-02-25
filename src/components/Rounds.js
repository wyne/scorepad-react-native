import React, { useEffect, useRef, useState } from 'react';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { createSelector } from 'reselect';

import { palette } from '../constants';
import RoundColumn from './Rounds/RoundColumn';

const selectAllRounds = createSelector(
    (state) => state.currentGame.scores,
    (scores) => scores[0]
)

const selectAllPlayers = createSelector(
    [
        (state) => state.currentGame.players,
    ],
    (players) => {
        return players;
    }
)

const Rounds = ({ navigation, show }) => {
    if (!show) { return null; }

    const [roundScollOffset, setRoundScrollOffset] = useState(0);

    // const currentRoundEl = useRef()
    const roundsScrollViewEl = useRef()

    // useEffect(() => {
    //     console.log("UE rso", roundScollOffset);
    //     if (roundScollOffset !== undefined) {
    //         roundsScrollViewEl.current.scrollTo({
    //             x: roundScollOffset,
    //             animated: Platform.OS == "ios" ? true : false
    //         })
    //     }
    // }, [roundScollOffset]);

    const onLayoutHandler = (event) => {
        const offset = event.nativeEvent.layout.x;
        console.log("layout handler", offset)
        setter(offset);
    }

    const players = useSelector(state => selectAllPlayers(state));

    const currentRound = useSelector(state => state.currentGame.currentRound, (p, n) => {
        return p == n;
    });

    const rounds = useSelector(selectAllRounds, (n, p) => {
        return n.length == p.length;
    });

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
                    <Text key={playerIndex} style={[styles.scoreEntry, { color: 'white', fontWeight: 'bold' }]} >
                        {
                            1000
                            // scores[playerIndex].reduce(
                            //     (a, b) => { return (a || 0) + (b || 0); }
                            // )
                        }
                    </Text>
                ))}
            </View>
        )
    }

    return (
        <SafeAreaView edges={['right', 'left']} style={{ flexDirection: 'row', backgroundColor: 'black', paddingBottom: 10, height: show ? 'auto' : 0 }}>

            <PlayerNameColumn />

            <TotalColumn />

            <ScrollView
                horizontal={true}
                contentContainerStyle={{ flexDirection: 'row' }}
            // ref={roundsScrollViewEl}
            >
                {
                    rounds.map((item, round) => (
                        <RoundColumn key={round} round={round}
                        // currentRoundLayoutHandler={onLayoutHandler}
                        />
                    ))
                }
            </ScrollView>

            <View flexDirection='column' style={{ justifyContent: 'space-around', padding: 15 }}>
                <TouchableOpacity onPress={() => { navigation.navigate("Settings") }} >
                    {show && <Icon size={30} color='#0a84ff' style={{ textAlign: 'center' }} name="cog" type="font-awesome-5" />}
                    {show && <Text style={{ color: '#0a84ff', fontWeight: 'bold' }}>Settings</Text>}
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

export default React.memo(Rounds);