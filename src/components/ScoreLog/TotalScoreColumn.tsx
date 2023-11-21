import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

import { selectGameById } from '../../../redux/GamesSlice';
import { useAppSelector } from '../../../redux/hooks';

import TotalScoreCell from './TotalScoreCell';

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
        textAlign: 'center',
        fontSize: 20,
    }
});

export default TotalScoreColumn;
