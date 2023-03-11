import React, { useEffect, useRef, useState } from 'react';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSelector } from 'react-redux';

import { selectGameById } from '../../redux/GamesSlice';
import RoundScoreColumn from './ScoreLog/RoundScoreColumn';
import TotalScoreColumn from './ScoreLog/TotalScoreColumn';
import PlayerNameColumn from './ScoreLog/PlayerNameColumn';

function Rounds({ navigation, show }) {
    const [roundScollOffset, setRoundScrollOffset] = useState({});

    const currentGameId = useSelector(state => state.settings.currentGameId);
    const roundCurrent = useSelector(state => selectGameById(state, currentGameId).roundCurrent);
    const roundTotal = useSelector(state => selectGameById(state, currentGameId).roundTotal);

    const roundsScrollViewEl = useRef()

    // Remember the round offset when the round changes
    const onLayoutHandler = (event, round) => {
        const offset = event.nativeEvent.layout.x;

        setRoundScrollOffset({
            ...roundScollOffset,
            [round]: offset
        });
    }

    // Scroll to the current round
    useEffect(() => {
        const offset = roundScollOffset[roundCurrent];
        roundsScrollViewEl.current.scrollTo({
            x: offset,
            animated: Platform.OS == "ios" ? true : false
        })
    }, [roundCurrent, roundScollOffset]);

    const roundsIterator = [...Array(roundTotal + 1).keys()];

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

            <View flexDirection='column' style={{ justifyContent: 'space-around', padding: 15 }}>
                <TouchableOpacity onPress={() => { navigation.navigate("Settings") }} >
                    {show && <Icon size={30} color='#0a84ff' style={{ textAlign: 'center' }} name="people" />}
                    {show && <Text style={{ color: '#0a84ff', fontWeight: 'bold' }}>Setup</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView >
    );
}

export default Rounds;
