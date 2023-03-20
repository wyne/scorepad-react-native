import React, { memo, useCallback } from 'react';
import { Text, View } from 'react-native';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { useSelector, useDispatch } from 'react-redux';

import { selectGameById, updateGame } from '../../../redux/GamesSlice';
import RoundScoreCell from './RoundScoreCell';

const RoundScoreColumn = ({ round, isCurrentRound }) => {
    const dispatch = useDispatch();

    const currentGameId = useSelector(state => state.settings.currentGameId);
    const currentGame = useSelector(state => selectGameById(state, currentGameId));

    const onLongPressHandler = useCallback(() => {
        dispatch(updateGame({
            id: currentGameId,
            changes: {
                roundCurrent: round,
            }
        })
        );
    });

    return (
        <TouchableWithoutFeedback onPress={onLongPressHandler}>
            <View
                style={{ padding: 10 }}
                backgroundColor={isCurrentRound ? '#111' : 'black'}>
                <Text style={{
                    color: isCurrentRound ? 'red' : 'yellow',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: 20,
                }}>
                    {round + 1}
                </Text>
                {currentGame.playerIds.map((playerId, playerIndex) => (
                    <RoundScoreCell playerId={playerId} round={round} key={playerId} index={playerIndex} />
                ))}
            </View>
        </TouchableWithoutFeedback>
    );
};

export default memo(RoundScoreColumn);
