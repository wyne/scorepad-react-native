import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { useSelector } from 'react-redux';

import { selectGameById } from '../../../redux/GamesSlice';
import { selectPlayersByIds } from '../../../redux/ScoreSelectors';
import RoundScoreCell from './RoundScoreCell';

const RoundScoreColumn = ({
    round,
    currentRoundEl,
    onLayoutHandler
}) => {
    const currentGameId = useSelector(state => state.settings.currentGameId);
    const currentGame = useSelector(state => selectGameById(state, currentGameId));
    const roundCurrent = useSelector(state => selectGameById(state, currentGameId).roundCurrent);

    return (
        <View style={{ padding: 10 }}
            backgroundColor={round == roundCurrent ? '#111' : 'black'}>
            <Text style={{
                color: roundCurrent == round ? 'red' : 'yellow',
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
}

export default RoundScoreColumn;
