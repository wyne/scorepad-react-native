import React, { memo, useCallback } from 'react';
import { Text, View , TouchableWithoutFeedback } from 'react-native';
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
                {currentGame.playerIds.map((playerId, playerIndex) => (
                    <RoundScoreCell playerId={playerId} round={round} key={playerId} playerIndex={playerIndex} />
                ))}
            </View>
        </TouchableWithoutFeedback>
    );
};

export default memo(RoundScoreColumn);
