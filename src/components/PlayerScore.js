import React from 'react';
import { Text, View, StyleSheet, TouchableHighlight, Dimensions, Platform, PixelRatio } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { ScaledSheet } from 'react-native-size-matters';
import { s, vs, ms, mvs } from 'react-native-size-matters';

import { incPlayerRoundScore, decPlayerRoundScore, setCardData } from '../../redux/CurrentGameActions';

const PlayerScore = ({ playerIndex, color, fontColor, cols, rows }) => {
    const players = useSelector(state => state.currentGame.players);
    const scores = useSelector(state => state.currentGame.scores);
    const currentRound = useSelector(state => state.currentGame.currentRound);
    const dispatch = useDispatch();

    const totalScore = scores[playerIndex].reduce(
        (a, b) => { return (a || 0) + (b || 0); }
    );

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
    }

    let width = null;
    let height = null;

    if (rows > 0 && cols > 0) {
        width = (100 / cols) + '%'
        height = (100 / rows) + '%'
    }

    const fontScale = (size) => {
        return ms(size, .5);
    }

    return (
        <View onLayout={(event) => measureView(event)}
            style={[styles.playerCard,
            { backgroundColor: color },
            { width: cols === 0 ? 'auto' : width },
            { height: rows == 0 ? 'auto' : height },
            ]}>

            <View style={{ padding: 10 }}>
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Text numberOfLines={1} style={[styles.name, { fontSize: fontScale(30), color: fontColor }]}>
                        {players[playerIndex].name}
                    </Text>
                </View>
                <View>
                    <Text style={[styles.totalScore, { color: fontColor, fontSize: fontScale(60) },]}>
                        {totalScore}
                    </Text>
                    <View style={[styles.roundBox, { borderColor: fontColor, }]}>
                        <Text style={[styles.roundScore, { fontSize: fontScale(20), color: fontColor }]}>
                            {scores[playerIndex][currentRound] || 0}
                        </Text>
                        <Text style={[styles.label, styles.roundLabel, { color: fontColor }]}>
                            Round {currentRound + 1}
                        </Text>
                    </View>
                </View>
            </View>

            <TouchableHighlight style={[styles.surface, styles.surfaceAdd]}
                underlayColor={fontColor + '30'}
                activeOpacity={1}
                onPress={incPlayerRoundScoreHandler}>
                <Text style={{ fontSize: 100, opacity: 0, color: color, textAlign: 'center' }}> </Text>
            </TouchableHighlight>

            <TouchableHighlight style={[styles.surface, styles.surfaceSubtract]}
                underlayColor={fontColor + '30'}
                activeOpacity={1}
                onPress={decPlayerRoundScoreHandler}>
                <Text style={{ fontSize: 100, opacity: 0, color: color, textAlign: 'center' }}> </Text>
            </TouchableHighlight>
        </View>
    );
}

const styles = ScaledSheet.create({
    playerCard: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
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
    totalScore: {
        margin: 2,
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'white',
        fontVariant: ['tabular-nums'],
    },
    roundBox: {
        padding: 5,
        borderRadius: 5,
        borderWidth: 2,
        alignSelf: 'center'
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