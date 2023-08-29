import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, ScrollView, Platform, LayoutChangeEvent } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';

import { selectGameById } from '../../redux/GamesSlice';
import RoundScoreColumn from './ScoreLog/RoundScoreColumn';
import TotalScoreColumn from './ScoreLog/TotalScoreColumn';
import PlayerNameColumn from './ScoreLog/PlayerNameColumn';
import { useAppSelector } from '../../redux/hooks';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    show: boolean;
}

interface RoundScollOffset {
    [key: number]: number;
}

const Rounds: React.FunctionComponent<Props> = ({ navigation, show }) => {
    const [roundScollOffset, setRoundScrollOffset] = useState<RoundScollOffset>({});

    const currentGameId = useAppSelector(state => state.settings.currentGameId);

    if (typeof currentGameId == 'undefined') return null;

    const roundCurrent = useAppSelector(state => selectGameById(state, currentGameId)?.roundCurrent || 0);
    const roundTotal = useAppSelector(state => selectGameById(state, currentGameId)?.roundTotal || 0);

    const roundsScrollViewEl = useRef<ScrollView>(null);

    // Remember the round offset when the round changes
    const onLayoutHandler = useCallback((event: LayoutChangeEvent, round: number) => {
        const offset = event.nativeEvent.layout.x;

        setRoundScrollOffset({
            ...roundScollOffset,
            [round]: offset
        });
    }, []);

    // Scroll to the current round
    useEffect(() => {
        const offset = roundScollOffset[roundCurrent];
        if (roundsScrollViewEl.current == null || typeof offset == 'undefined') return;

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
                            round={round}
                            key={round}
                            isCurrentRound={round == roundCurrent} />
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    scoreTableContainer: {
        flexDirection: 'row',
        backgroundColor: 'black',
        paddingBottom: 10,
    }
});

export default Rounds;
