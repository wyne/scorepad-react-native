import React, { memo, useCallback } from 'react';

import { LayoutChangeEvent, Text, TouchableWithoutFeedback, View } from 'react-native';

import { updateGame } from '../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector, useAppStore } from '../../../redux/hooks';
import { selectCurrentGame } from '../../../redux/selectors';
import { logEvent } from '../../Analytics';
import { useTheme } from '../../theme';

import RoundScoreCell from './RoundScoreCell';
import { SortSelectorKey, sortSelectors } from './SortHelper';
import { CURRENT_ROUND_BACKGROUND, tableStyles } from './tableMetrics';

interface Props {
    round: number;
    isCurrentRound: boolean;
    disabled?: boolean;
    onLayout?: (event: LayoutChangeEvent, round: number) => void;
}

const RoundScoreColumn: React.FunctionComponent<Props> = ({
    round,
    isCurrentRound,
    disabled = false,
    onLayout,
}) => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const store = useAppStore();

    const currentGameId = useAppSelector(state => selectCurrentGame(state)?.id);
    const sortKey = useAppSelector(state => selectCurrentGame(state)?.sortSelectorKey);
    const sortSelector = sortSelectors[sortKey || SortSelectorKey.ByIndex];
    const sortedPlayerIds = useAppSelector(sortSelector);

    const onPressHandler = useCallback(() => {
        if (disabled || !currentGameId) return;

        // Read the round we're leaving before we change it (callback has stable deps).
        const fromRound = selectCurrentGame(store.getState())?.roundCurrent ?? round;
        dispatch(updateGame({
            id: currentGameId,
            changes: {
                roundCurrent: round,
            }
        }));
        void logEvent('round_change', {
            game_id: currentGameId,
            source: 'direct select',
            from_round: fromRound,
            to_round: round,
        });
    }, [currentGameId, disabled, dispatch, round, store]);

    return (
        <TouchableWithoutFeedback onPress={onPressHandler}>
            <View
                onLayout={(e) => onLayout?.(e, round)}
                style={{ backgroundColor: isCurrentRound ? CURRENT_ROUND_BACKGROUND : 'transparent' }}>
                <Text style={[tableStyles.header, {
                    color: isCurrentRound ? theme.tint : theme.textTertiary,
                    fontWeight: isCurrentRound ? '700' : '600',
                }]}>
                    {round + 1}
                </Text>
                {sortedPlayerIds.map((playerId, playerIndex) => (
                    <RoundScoreCell playerId={playerId} round={round} key={playerId} playerIndex={playerIndex} />
                ))}
            </View>
        </TouchableWithoutFeedback>
    );
};

export default memo(RoundScoreColumn);
