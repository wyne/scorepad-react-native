import React, { memo, useCallback } from 'react';
import { Text, View } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native';
import analytics from '@react-native-firebase/analytics';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';

import { selectGameById, updateGame } from '../../../redux/GamesSlice';
import RoundScoreCell from './RoundScoreCell';

interface Props {
    round: number;
    isCurrentRound: boolean;
    disabled?: boolean;
}

const RoundScoreColumn: React.FunctionComponent<Props> = ({ round, isCurrentRound, disabled = false }) => {
    const dispatch = useAppDispatch();

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(state => selectGameById(state, currentGameId));

    if (typeof currentGame == 'undefined') return null;

    const onPressHandler = useCallback(async () => {
        if (disabled) return;

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

    return (
        <TouchableWithoutFeedback onPress={onPressHandler}>
            <View style={{
                padding: 10,
                // backgroundColor: isCurrentRound ? '#111' : 'black'
            }}>
                <Text style={{
                    color: isCurrentRound ? 'red' : 'yellow',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: 20,
                }}>
                    {round + 1}
                </Text>
                {currentGame.playerIds.map((playerId, playerIndex) => (
                    <RoundScoreCell playerId={playerId} round={round} key={playerId} playerIndex={playerIndex} />
                ))}
            </View>
        </TouchableWithoutFeedback>
    );
};

export default memo(RoundScoreColumn);
