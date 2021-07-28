import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Animated, TouchableHighlight } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Dimensions } from 'react-native';

import { incPlayerRoundScore, decPlayerRoundScore, setCardData } from '../../redux/CurrentGameActions';

const RoundScore = ({ fontColor, playerIndex }) => {
    const scores = useSelector(state => state.currentGame.scores);
    const players = useSelector(state => state.currentGame.players);
    const currentRound = useSelector(state => state.currentGame.currentRound);

    return (
        <View style={{
            padding: 5,
            borderRadius: 5,
            borderWidth: 2,
            borderColor: '#' + fontColor,
            alignSelf: 'center'
        }}>
            <Text style={[
                styles.roundScore,
                {
                    fontSize: players.length > 4 ? 30 : 40,
                    color: '#' + fontColor
                }
            ]}>{scores[playerIndex][currentRound] || 0}</Text>
            <Text style={[
                styles.label,
                styles.roundLabel,
                { color: '#' + fontColor }
            ]}>
                Round {currentRound + 1}
            </Text>
        </View>
    );
}

const TotalScore = ({ fontColor, playerIndex }) => {
    const scores = useSelector(state => state.currentGame.scores);
    const players = useSelector(state => state.currentGame.players);

    const totalScore = scores[playerIndex].reduce(
        (a, b) => {
            return (a || 0) + (b || 0);
        }
    );

    const _styles = [{
        margin: 2,
        fontSize: 90,
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'white',
        fontVariant: ['tabular-nums'],
        fontSize: players.length > 4 ? 50 : 90,
        color: '#' + fontColor
    }];

    return (
        <Text style={_styles}>
            {totalScore}
        </Text>
    );
}

const PlayerScore = ({ playerIndex, color, fontColor, cols, rows, parentFn }) => {
    const players = useSelector(state => state.currentGame.players);

    const dispatch = useDispatch();

    const incPlayerRoundScoreHandler = () => {
        dispatch(incPlayerRoundScore(playerIndex));
    }

    const decPlayerRoundScoreHandler = () => {
        dispatch(decPlayerRoundScore(playerIndex));
    }

    const measureView = (e) => {
        if (rows == 0 && cols == 0) {
            dispatch(setCardData(playerIndex, e.nativeEvent.layout));
        }
        // if (playerIndex == players.length - 1) {
        parentFn
        // }
    }

    useEffect(() => {
        parentFn()
    }, [])

    let width = null;
    let height = null;

    if (rows == 0 && cols == 0) {
    } else {
        width = (100 / cols) + '%'
        height = (100 / rows) + '%'
    }

    return (
        <View style={[
            styles.playerCard,
            { backgroundColor: '#' + color },
            { overflow: 'hidden' },
            { width: cols === 0 ? 'auto' : width },
            { height: rows == 0 ? 'auto' : height },
        ]}
            onLayout={(event) => measureView(event)}
        >

            <View style={{ padding: 10, }}>
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={[
                        styles.name,
                        {
                            fontSize: players.length > 4 ? 30 : 50,
                            color: '#' + fontColor
                        },
                    ]}
                        adjustsFontSizeToFit={true}
                        numberOfLines={1}
                    >
                        {players[playerIndex].name}
                    </Text>
                </View>
                <View>
                    <TotalScore fontColor={fontColor} playerIndex={playerIndex} />
                    <RoundScore fontColor={fontColor} playerIndex={playerIndex} />
                </View>
            </View>

            <TouchableHighlight style={[styles.surface, styles.surfaceAdd]}
                underlayColor={'#' + fontColor + '30'}
                activeOpacity={1}
                onPress={incPlayerRoundScoreHandler}
            >
                <Text style={{ fontSize: 100, opacity: 0, color: '#' + color, textAlign: 'center' }}>
                    {/* +1  */}
                </Text>
            </TouchableHighlight>

            <TouchableHighlight style={[styles.surface, styles.surfaceSubtract]}
                underlayColor={'#' + fontColor + '30'}
                activeOpacity={1}
                onPress={decPlayerRoundScoreHandler}
            >
                <Text style={{ fontSize: 100, opacity: 0, color: '#' + color, textAlign: 'center' }}>
                    {/* -1 */}
                </Text>
            </TouchableHighlight>
        </View>
    );
}

const styles = StyleSheet.create({
    playerCard: {
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
    roundScore: {
        alignSelf: 'center',
        fontSize: 40,
        margin: 0,
        marginTop: 0,
        padding: 0,
    },
    label: {
        textAlign: 'center',
        alignSelf: 'center',
        color: 'white',
    },
    roundLabel: {
        fontVariant: ['tabular-nums'],
        alignSelf: 'center',
        textAlign: 'center',
    },
});

export default PlayerScore;