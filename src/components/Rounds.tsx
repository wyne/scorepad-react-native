import React, { useEffect, useRef, useState, useCallback } from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, StyleSheet, ScrollView, Platform, LayoutChangeEvent } from 'react-native';

import { selectGameById } from '../../redux/GamesSlice';
import { useAppSelector } from '../../redux/hooks';

import PlayerNameColumn from './ScoreLog/PlayerNameColumn';
import RoundScoreColumn from './ScoreLog/RoundScoreColumn';
import TotalScoreColumn from './ScoreLog/TotalScoreColumn';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    show: boolean;
}

interface RoundScollOffset {
    [key: number]: number;
}

const MemoizedRoundScoreColumn = React.memo(RoundScoreColumn);
const MemoizedTotalScoreColumn = React.memo(TotalScoreColumn);
const MemoizedPlayerNameColumn = React.memo(PlayerNameColumn);

const Rounds: React.FunctionComponent<Props> = ({ }) => {
    const [roundScollOffset, setRoundScrollOffset] = useState<RoundScollOffset>({});

    const currentGameId = useAppSelector(state => state.settings.currentGameId);

    if (typeof currentGameId == 'undefined') return null;

    const roundCurrent = useAppSelector(state => selectGameById(state, currentGameId)?.roundCurrent || 0);
    const roundTotal = useAppSelector(state => selectGameById(state, currentGameId)?.roundTotal || 1);

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
            animated: Platform.OS == 'ios' ? true : false
        });
    }, [roundCurrent, roundScollOffset]);

    const roundsIterator = [...Array(roundTotal).keys()];

    return (
        <View style={[styles.scoreTableContainer]}>
            <MemoizedPlayerNameColumn />
            <MemoizedTotalScoreColumn />
            <ScrollView horizontal={true}
                contentContainerStyle={{ flexDirection: 'row' }}
                ref={roundsScrollViewEl}>
                {roundsIterator.map((item, round) => (
                    <MemoizedRoundScoreColumn
                        onLayout={round == roundCurrent ? e => onLayoutHandler(e, round) : undefined}
                        round={round}
                        key={round}
                        isCurrentRound={round == roundCurrent} />
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    scoreTableContainer: {
        flexDirection: 'row',
    }
});

export default Rounds;
