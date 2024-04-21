import React, { useCallback, useEffect, useRef, useState } from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LayoutChangeEvent, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { selectGameById, selectSortSelectorKey, setSortSelector } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';

import PlayerNameColumn from './ScoreLog/PlayerNameColumn';
import RoundScoreColumn from './ScoreLog/RoundScoreColumn';
import { SortSelectorKey, sortSelectors } from './ScoreLog/SortHelper';
import TotalScoreColumn from './ScoreLog/TotalScoreColumn';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    show: boolean;
}

interface RoundScollOffset {
    [key: number]: number;
}

const MemoizedRoundScoreColumn = React.memo(RoundScoreColumn);

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

    const dispatch = useAppDispatch();

    const sortSelectorKey = useAppSelector(state => selectSortSelectorKey(state, currentGameId));
    const sortSelector = sortSelectors[sortSelectorKey];

    const sortByPlayerIndex = () => {
        dispatch(setSortSelector({ gameId: currentGameId, sortSelector: SortSelectorKey.ByIndex }));
    };

    const sortByTotalScore = () => {
        dispatch(setSortSelector({ gameId: currentGameId, sortSelector: SortSelectorKey.ByScore }));
    };

    return (
        <View style={[styles.scoreTableContainer]}>
            <TouchableOpacity onPress={sortByPlayerIndex}>
                <PlayerNameColumn />
            </TouchableOpacity>

            <TouchableOpacity onPress={sortByTotalScore}>
                <TotalScoreColumn />
            </TouchableOpacity>

            <ScrollView horizontal={true}
                contentContainerStyle={{ flexDirection: 'row' }}
                ref={roundsScrollViewEl}>
                {roundsIterator.map((item, round) => (
                    <View key={round} onLayout={e => onLayoutHandler(e, round)}>
                        <MemoizedRoundScoreColumn
                            sortSelector={sortSelector}
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
    }
});

export default Rounds;
