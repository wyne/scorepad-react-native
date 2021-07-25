import React from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Dimensions } from 'react-native';

import { incPlayerRoundScore, decPlayerRoundScore } from '../../redux/CurrentGameActions';

function PlayerScore({ playerIndex, color, fontColor }) {
    const scores = useSelector(state => state.currentGame.scores);
    const players = useSelector(state => state.currentGame.players);
    const currentRound = useSelector(state => state.currentGame.currentRound);

    const dispatch = useDispatch();

    const incPlayerRoundScoreHandler = () => {
        dispatch(incPlayerRoundScore(playerIndex));
    }

    const decPlayerRoundScoreHandler = () => {
        dispatch(decPlayerRoundScore(playerIndex));
    }

    let cardHeights = null;
    const measureView = (e) => {
        // cardHeights = e.nativeEvent.layout.height;
        // console.log("card height", cardHeights);
    }

    return (
        <View style={[
            styles.playerCard,
            { backgroundColor: '#' + color },
            // { maxWidth: Math.ceil(Dimensions.get('window').width / Math.ceil(players.length / 3)) + 20 },
            // { maxWidth: '25%' }
            // { flexBasis: '50%' }
            // rows = (content height + 1) / cardHeights
            // 100 / (ceil(count / rows)
        ]}
            onLayout={(playerIndex <= 1) ? (event) => measureView(event) : false}
        >

            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Text style={[
                    styles.name,
                    {
                        fontSize: players.length > 4 ? 30 : 50,
                        color: '#' + fontColor
                    },
                    // { maxWidth: players.length > 4 ? Dimensions.get('window').width / 4 : Dimensions.get('window').width / 3 },
                    // { minHeight: players.length > 4 ? '25%' : Dimensions.get('window').width / 3 },
                ]}
                    adjustsFontSizeToFit={true}
                    numberOfLines={1}
                >
                    {players[playerIndex].name}
                </Text>
            </View>
            <View>
                <Text style={[
                    styles.score,
                    {
                        fontSize: players.length > 4 ? 50 : 90,
                        color: '#' + fontColor
                    }
                ]}>
                    {scores[playerIndex].reduce((a, b) => { return (a || 0) + (b || 0); })}
                </Text>
                <View style={{
                    padding: 5,
                    borderRadius: 5,
                    borderWidth: 2,
                    borderColor: '#' + fontColor,
                    alignSelf: 'center',
                }}>
                    <Text style={[
                        styles.score,
                        styles.roundScore,
                        {
                            fontSize: players.length > 4 ? 30 : 40,
                            color: '#' + fontColor
                        }
                    ]}>{scores[playerIndex][currentRound] || 0}</Text>
                    <Text style={[
                        styles.label,
                        styles.roundLabel],
                        { color: '#' + fontColor }
                    }>
                        Round {currentRound + 1}
                    </Text>
                </View>
            </View>

            <TouchableOpacity style={[styles.surface, styles.surfaceAdd]}
                onPress={incPlayerRoundScoreHandler}
            />
            <TouchableOpacity style={[styles.surface, styles.surfaceSubtract]}
                onPress={decPlayerRoundScoreHandler}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    playerCard: {
        padding: 10,
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    surface: {
        position: 'absolute',
        width: '100%',
        borderColor: 'red',
    },
    surfaceAdd: {
        top: 0,
        bottom: '50%',
    },
    surfaceSubtract: {
        top: '50%',
        bottom: 0,
    },
    name: {
        color: 'white',
        fontSize: 50,
        fontWeight: 'bold',
        textAlign: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    score: {
        margin: 2,
        fontSize: 90,
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'white',
        fontVariant: ['tabular-nums'],
    },
    roundScore: {
        fontSize: 40,
        margin: 0,
        marginTop: 0,
        padding: 0,
    },
    label: {
        textAlign: 'center',
        color: 'white',
    },
    roundLabel: {
        fontVariant: ['tabular-nums'],
    },
});

export default PlayerScore;