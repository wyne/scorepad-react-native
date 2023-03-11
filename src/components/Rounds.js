import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, StyleSheet, ScrollView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';


import { selectGameById } from '../../redux/GamesSlice';
import RoundScoreColumn from './ScoreLog/RoundScoreColumn';
import TotalScoreColumn from './ScoreLog/TotalScoreColumn';
import PlayerNameColumn from './ScoreLog/PlayerNameColumn';
import { systemBlue } from '../constants';

function Rounds({ navigation, show }) {
    const dispatch = useDispatch();
    const [roundScollOffset, setRoundScrollOffset] = useState({});

    const currentGameId = useSelector(state => state.settings.currentGameId);
    const roundCurrent = useSelector(state => selectGameById(state, currentGameId).roundCurrent);
    const roundTotal = useSelector(state => selectGameById(state, currentGameId).roundTotal);

    const roundsScrollViewEl = useRef();

    // Remember the round offset when the round changes
    const onLayoutHandler = useCallback((event, round) => {
        const offset = event.nativeEvent.layout.x;

        setRoundScrollOffset({
            ...roundScollOffset,
            [round]: offset
        });
    });

    // Scroll to the current round
    useEffect(() => {
        const offset = roundScollOffset[roundCurrent];
        roundsScrollViewEl.current.scrollTo({
            x: offset,
            animated: Platform.OS == "ios" ? true : false
        });
    }, [roundCurrent, roundScollOffset]);

    const roundsIterator = [...Array(roundTotal + 1).keys()];

    const expandHandler = () => {
        dispatch(toggleHomeFullscreen());
    };

    return (
        <SafeAreaView edges={['right', 'left']} style={{ flexDirection: 'row', backgroundColor: 'black', paddingBottom: 10, height: show ? 'auto' : 0 }}>
            <PlayerNameColumn />
            <TotalScoreColumn />
            <ScrollView
                horizontal={true}
                contentContainerStyle={{ flexDirection: 'row' }}
                ref={roundsScrollViewEl}
            >
                {roundsIterator.map((item, round) => (
                    <View key={round}
                        onLayout={e => onLayoutHandler(e, round)} >
                        <RoundScoreColumn
                            collapsable={false}
                            round={round}
                            key={round}
                            isCurrentRound={round == roundCurrent}
                        />
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    header: {
        alignItems: 'baseline',
        backgroundColor: 'black',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 0,
        textAlign: 'center',
    },
    title: {
        color: 'white',
        fontSize: 25,
        fontVariant: ['tabular-nums'],
        fontWeight: 'bold'
    },
    multiplier: {
        color: systemBlue,
        paddingRight: 5,
        fontSize: 25,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    roundButton: {
        color: systemBlue,
        fontSize: 25,
        fontWeight: 'bold',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
});

export default Rounds;
