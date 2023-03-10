import React, { useEffect, useRef, useState } from 'react';
import { Icon } from 'react-native-elements/dist/icons/Icon';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSelector } from 'react-redux';

import RoundScoreColumn from './ScoreLog/RoundScoreColumn';
import { selectGameById } from '../../redux/GamesSlice';
import TotalScoreColumn from './ScoreLog/TotalScoreColumn';

function Rounds({ navigation, show }) {
    const [roundScollOffset, setRoundScrollOffset] = useState(0);

    const currentGameId = useSelector(state => state.settings.currentGameId);
    const roundCurrent = useSelector(state => selectGameById(state, currentGameId).roundCurrent);
    const roundTotal = useSelector(state => selectGameById(state, currentGameId).roundTotal);

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

    const roundsIterator = [...Array(roundTotal + 1).keys()];

    return (
        <SafeAreaView edges={['right', 'left']} style={{ flexDirection: 'row', backgroundColor: 'black', paddingBottom: 10, height: show ? 'auto' : 0 }}>

            {/* <PlayerNameColumn players={players} /> */}

            <TotalScoreColumn />

            <ScrollView
                horizontal={true}
                contentContainerStyle={{ flexDirection: 'row' }}
                ref={roundsScrollViewEl}
            >
                {roundsIterator.map((item, round) => (
                    <RoundScoreColumn
                        round={round}
                        key={round}
                    // currentRoundEl={currentRoundEl}
                    // onLayoutHandler={onLayoutHandler}
                    />
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
