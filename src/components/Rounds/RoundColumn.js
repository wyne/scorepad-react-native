import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { shallowEqual, useSelector } from 'react-redux'
import { createSelector } from 'reselect';

const selectAllPlayers = createSelector(
    [
        (state) => state.currentGame.players,
    ],
    (players) => {
        return players;
    }
)

const selectRoundScores = createSelector(
    [
        (state) => state.currentGame.scores,
        (state, round) => round
    ],
    (scores, round) => {
        const f = scores.map(playerScore => {
            return playerScore[round];
        });
        return f;
    }
)

const selectCurrentRound = createSelector(
    [
        (state) => state.currentGame.currentRound,
        (state, round) => round
    ],
    (cr, round) => {
        return cr == round
    }
)

const RoundColumn = ({ round, currentRoundLayoutHandler }) => {
    const players = useSelector(state => selectAllPlayers(state));
    const isCurrent = useSelector(state => selectCurrentRound(state, round));
    const roundScores = useSelector(state => selectRoundScores(state, round), (n, p) => {
        return JSON.stringify(n) == JSON.stringify(p);
    });

    const onLayout = (e) => {
        console.log("col layout", e)
    }

    return (
        <View style={{ padding: 10 }}
            // onLayout={isCurrent ? (e) => currentRoundLayoutHandler(e, round) : null}
            onLayout={isCurrent ? onLayout : null}
            backgroundColor={isCurrent ? '#111' : 'black'}
        >
            <Text style={{
                color: isCurrent ? 'red' : 'yellow',
                fontWeight: 'bold',
                textAlign: 'center',
                fontSize: 20,
            }}>
                {round + 1}
            </Text>
            {
                players.map((player, playerIndex) => (
                    <Text key={playerIndex} style={[
                        styles.scoreEntry,
                        { color: roundScores[playerIndex] == 0 ? '#555' : 'white' }]}>
                        {roundScores[playerIndex]}
                    </Text>
                ))
            }
        </View>
    );
}

export default React.memo(RoundColumn);

const styles = StyleSheet.create({
    totalHeader: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 20,
    },
    scoreEntry: {
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
        color: 'white',
        fontSize: 20,
    }
});