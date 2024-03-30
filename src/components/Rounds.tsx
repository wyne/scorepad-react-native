import React, { useCallback, useEffect, useRef, useState } from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LayoutChangeEvent, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { selectGameById } from '../../redux/GamesSlice';
import { useAppSelector } from '../../redux/hooks';

import PlayerNameColumn from './ScoreLog/PlayerNameColumn';
import RoundScoreColumn from './ScoreLog/RoundScoreColumn';
import { sortSelectors } from './ScoreLog/SortHelper';
import TotalScoreColumn from './ScoreLog/TotalScoreColumn';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    show: boolean;
}

interface RoundScollOffset {
    [key: number]: number;
}

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
            animated: Platform.OS == "ios" ? true : false
        });
    }, [roundCurrent, roundScollOffset]);

    const roundsIterator = [...Array(roundTotal).keys()];

    const [sortSelectorIndex, setSortSelectorIndex] = useState<number>(0);

    const nextSort = () => {
        setSortSelectorIndex((sortSelectorIndex + 1) % sortSelectors.length);
    };

    return (
        <View style={[styles.scoreTableContainer]}>
            <TouchableOpacity onPress={nextSort}>
                <PlayerNameColumn sortSelector={sortSelectors[sortSelectorIndex]} />
            </TouchableOpacity>
            <TotalScoreColumn sortSelector={sortSelectors[sortSelectorIndex]} />
            <ScrollView horizontal={true}
                contentContainerStyle={{ flexDirection: 'row' }}
                ref={roundsScrollViewEl}>
                {roundsIterator.map((item, round) => (
                    <View key={round} onLayout={e => onLayoutHandler(e, round)}>
                        <RoundScoreColumn
                            sortSelector={sortSelectors[sortSelectorIndex]}
                            round={round}
                            key={round}
                            isCurrentRound={round == roundCurrent} />
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    scoreTableContainer: {
        flexDirection: 'row',
        paddingBottom: 10,
    }
});

export default Rounds;
