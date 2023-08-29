import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { selectGameById } from '../../../redux/GamesSlice';
import TotalScoreCell from './TotalScoreCell';
import { useAppSelector } from '../../../redux/hooks';

const TotalScoreColumn = ({ }) => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(state => selectGameById(state, currentGameId));

    if (typeof currentGame == 'undefined') return null;

    const playerIds = currentGame.playerIds;

    return (
        <View key={'total'} style={{ padding: 10 }}>
            <Text style={[styles.totalHeader]}>
                Total
            </Text>
            {playerIds.map((playerId) => (
                <TotalScoreCell key={playerId} playerId={playerId} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    totalHeader: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 20,
    }
});

export default TotalScoreColumn;
