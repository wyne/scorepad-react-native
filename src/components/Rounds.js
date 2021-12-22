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
    (state) => state.currentGame.players,
    (players) => players
)


function Rounds({ navigation, show }) {
    if (!show) { return null; }

    // useEffect(() => {
    //     if (roundScollOffset !== undefined) {
    //         roundsScrollViewEl.current.scrollTo({
    //             x: roundScollOffset,
    //             animated: Platform.OS == "ios" ? true : false
    //         })
    //     }
    // }, [roundScollOffset]);

    // const onLayoutHandler = (event, round) => {
    //     if (round != currentRound) {
    //         return;
    //     }
    //     const offset = event.nativeEvent.layout.x;
    //     setRoundScrollOffset(offset);
    // }
    const currentRound = useSelector(state => state.currentGame.currentRound, (p, n) => {
        return p == n;
    });
    const rounds = useSelector(selectAllRounds, (n, p) => {
        return n.length == p.length;
    });


    return (
        <SafeAreaView edges={['right', 'left']} style={{ flexDirection: 'row', backgroundColor: 'black', paddingBottom: 10, height: show ? 'auto' : 0 }}>

            {/* <PlayerNameColumn /> */}

            {/* <TotalColumn /> */}

            <ScrollView
                horizontal={true}
                contentContainerStyle={{ flexDirection: 'row' }}
            // ref={roundsScrollViewEl}
            >
                {
                    rounds.map((item, round) => (
                        <RoundColumn round={round} key={round} />
                    ))
                }
            </ScrollView>

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