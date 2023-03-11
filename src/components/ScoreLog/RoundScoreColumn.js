import React, { memo, useCallback } from 'react';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';

import { selectGameById } from '../../../redux/GamesSlice';
import RoundScoreCell from './RoundScoreCell';

const RoundScoreColumn = ({ round, isCurrentRound }) => {
    const currentGameId = useSelector(state => state.settings.currentGameId);
    const currentGame = useSelector(state => selectGameById(state, currentGameId));

    return (
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
    );
};

export default memo(RoundScoreColumn);
