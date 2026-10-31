import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import { LayoutChangeEvent, Platform, ScrollViewInstance, StyleSheet, View } from 'react-native';
import { TouchableOpacity, ScrollView } from 'react-native-gesture-handler';
import Animated, { FadeIn } from 'react-native-reanimated';

import { selectGameById, setSortSelector } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectGameModesVisible } from '../../redux/selectors';
import { logEvent } from '../Analytics';
import { useTheme } from '../theme';

import PlayerNameColumn from './ScoreLog/PlayerNameColumn';
import RankColumn from './ScoreLog/RankColumn';
import RoundScoreColumn from './ScoreLog/RoundScoreColumn';
import { SortSelectorKey } from './ScoreLog/SortHelper';
import TotalScoreColumn from './ScoreLog/TotalScoreColumn';

interface Props {
    /**
     * Whether to render the round columns. The game sheet holds them back
     * while it opens; the frozen columns always render so the table keeps
     * its shape, and the rounds fade in beside them.
     */
    showRounds?: boolean;
}

interface RoundScrollOffset {
    [key: number]: number;
}

const MemoizedRoundScoreColumn = React.memo(RoundScoreColumn);

const ScoreLogTable: React.FunctionComponent<Props> = ({ showRounds = true }) => {
    const [roundScrollOffset, setRoundScrollOffset] = useState<RoundScrollOffset>({});

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentRoundIndex = useAppSelector(
        state => selectGameById(state, currentGameId ?? '')?.roundCurrent || 0
    );
    const roundCount = useAppSelector(
        state => selectGameById(state, currentGameId ?? '')?.roundTotal || 1
    );
    // A locked game stays on its last round, so its columns can't pick another.
    const locked = useAppSelector(
        state => selectGameById(state, currentGameId ?? '')?.locked === true
    );

    // Places are part of game modes, so they follow the same flag.
    const showRanks = useAppSelector(state => selectGameModesVisible(state, currentGameId));

    const theme = useTheme();

    const scoreLogScrollViewEl = useRef<ScrollViewInstance>(null);

    // Remember the round offset when the round changes
    const onLayoutHandler = useCallback((event: LayoutChangeEvent, round: number) => {
        const offset = event.nativeEvent.layout.x;

        setRoundScrollOffset(prev => ({
            ...prev,
            [round]: offset
        }));
    }, []);

    // Scroll to the current round
    useEffect(() => {
        const offset = roundScrollOffset[currentRoundIndex];
        if (scoreLogScrollViewEl.current == null || typeof offset == 'undefined') return;

        scoreLogScrollViewEl.current.scrollTo({
            x: offset,
            animated: Platform.OS == 'ios' ? true : false
        });
    }, [currentRoundIndex, roundScrollOffset]);

    const roundsIterator = [...Array(roundCount).keys()];

    const dispatch = useAppDispatch();

    const sortByPlayerIndex = useCallback(() => {
        if (!currentGameId) return;
        dispatch(setSortSelector({ gameId: currentGameId, sortSelector: SortSelectorKey.ByIndex }));
        logEvent('sort_by_index', { game_id: currentGameId });
    }, [dispatch, currentGameId]);

    const sortByTotalScore = useCallback(() => {
        if (!currentGameId) return;
        dispatch(setSortSelector({ gameId: currentGameId, sortSelector: SortSelectorKey.ByScore }));
        logEvent('sort_by_score', { game_id: currentGameId });
    }, [dispatch, currentGameId]);

    if (typeof currentGameId == 'undefined') return null;

    return (
        <View style={[styles.scoreTableContainer, { backgroundColor: theme.backgroundSecondary }]}>
            {showRanks && <RankColumn />}

            <TouchableOpacity onPress={sortByPlayerIndex}>
                <PlayerNameColumn />
            </TouchableOpacity>

            <TouchableOpacity onPress={sortByTotalScore}>
                <TotalScoreColumn />
            </TouchableOpacity>

            {showRounds && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.rounds}>
                    <ScrollView horizontal={true}
                        nestedScrollEnabled={true}
                        contentContainerStyle={{ flexDirection: 'row' }}
                        overScrollMode="always"
                        ref={scoreLogScrollViewEl}>
                        {roundsIterator.map((item, round) => (
                            <View key={round} onLayout={e => onLayoutHandler(e, round)}>
                                <MemoizedRoundScoreColumn
                                    round={round}
                                    key={round}
                                    isCurrentRound={round == currentRoundIndex}
                                    disabled={locked}
                                />
                            </View>
                        ))}
                    </ScrollView>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    scoreTableContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        overflow: 'hidden',
        marginHorizontal: 5,
        marginBottom: 10,
    },
    rounds: {
        flex: 1,
    },
});

export default memo(ScoreLogTable);
