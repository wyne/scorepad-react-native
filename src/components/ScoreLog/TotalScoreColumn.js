import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';

import { selectGameById } from '../../../redux/GamesSlice';
import { selectPlayersByIds } from '../../../redux/ScoreSelectors';
import TotalScoreCell from './TotalScoreCell';

const TotalScoreColumn = ({ }) => {
    const currentGameId = useSelector(state => state.settings.currentGameId);
    const currentGame = useSelector(state => selectGameById(state, currentGameId));
    const players = useSelector(state => selectPlayersByIds(state, currentGame.playerIds));

    return (
        <View key={'total'} style={{ padding: 10 }}>
            <Text style={[styles.totalHeader]}>
                Total
            </Text>
            {players.map((player) => (
                <TotalScoreCell key={player.id} playerId={player.id} />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    totalHeader: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 20,
    }
});

export default TotalScoreColumn;
