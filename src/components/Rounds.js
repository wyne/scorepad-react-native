import React, { useEffect, useRef, useState, useCallback } from 'react';
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

    return (
        <SafeAreaView edges={['right', 'left']}
            style={[styles.scoreTableContainer, { height: show ? 'auto' : 0, }]}>
            <PlayerNameColumn navigation={navigation} />
            <TotalScoreColumn />
            <ScrollView horizontal={true}
                contentContainerStyle={{ flexDirection: 'row' }}
                ref={roundsScrollViewEl} >
                {roundsIterator.map((item, round) => (
                    <View key={round}
                        onLayout={e => onLayoutHandler(e, round)}>
                        <RoundScoreColumn
                            collapsable={false}
                            round={round}
                            key={round}
                            isCurrentRound={round == roundCurrent} />
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scoreTableContainer: {
        flexDirection: 'row',
        backgroundColor: 'black',
        paddingBottom: 10,
    }
});

export default Rounds;
