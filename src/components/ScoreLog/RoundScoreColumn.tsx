import React, { memo, useCallback } from 'react';

import analytics from '@react-native-firebase/analytics';
import { Text, TouchableWithoutFeedback, View } from 'react-native';

import { updateGame } from '../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { selectCurrentGame } from '../../../redux/selectors';
import { RootState } from '../../../redux/store';

import RoundScoreCell from './RoundScoreCell';

interface Props {
    round: number;
    isCurrentRound: boolean;
    disabled?: boolean;
    sortSelector: (state: RootState) => string[];
}

const RoundScoreColumn: React.FunctionComponent<Props> = ({ round, isCurrentRound, disabled = false, sortSelector }) => {
    const dispatch = useAppDispatch();

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(selectCurrentGame);

    if (typeof currentGame == 'undefined') return null;

    const sortedPlayerIds = useAppSelector(sortSelector);

    const onPressHandler = useCallback(async () => {
        if (disabled || !currentGameId) return;

        dispatch(updateGame({
            id: currentGameId,
            changes: {
                roundCurrent: round,
            }
        }));
        await analytics().logEvent('round_change', {
            game_id: currentGameId,
            source: 'direct select',
        });
    }, []);

    let backgroundColor = 'rgba(0,0,0,0)';

    if (isCurrentRound) {
        backgroundColor = 'rgba(255,0,0,.1)';
    } else if (round % 2 == 0) {
        backgroundColor = 'rgba(0,0,0,.1)';
    }

    return (
        <TouchableWithoutFeedback onPress={onPressHandler}>
            <View style={{
                padding: 10,
                paddingBottom: 0,
                backgroundColor: backgroundColor,
            }}>
                <Text style={{
                    color: isCurrentRound ? 'red' : '#AAA',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: 20,
                }}>
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
