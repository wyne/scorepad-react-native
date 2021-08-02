import React from 'react';
import { Text, View, StyleSheet, TouchableHighlight } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
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
    const roundScore = scores[playerIndex][currentRound] || 0

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

    const lengthScale = (lengthOf, size) => {
        return ms(size - (lengthOf).toString().length * 4, .5) - players.length;
    }
    const nameLengthScale = () => {
        const lengthOf = players[playerIndex].name.toString().length
        const baseSize = 30
        if (lengthOf > 5) {
            return ms(baseSize - (lengthOf).toString().length * 5, .5);
        } else {
            return ms(baseSize, .5)
        }
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
                    <Text numberOfLines={1} style={[styles.name, { fontSize: nameLengthScale(), lineHeight: s(30), color: fontColor }]}>
                        {players[playerIndex].name}
                    </Text>
                </View>
                <View>
                    <Text numberOfLines={1}
                        style={[styles.totalScore, { color: fontColor, fontSize: lengthScale(totalScore, 60), lineHeight: ms(60, .5) },]}>
                        {totalScore}
                    </Text>
                    <View style={[styles.roundBox, { borderColor: fontColor, padding: ms(5, .4) }]}>
                        <Text style={[styles.roundScore, { fontSize: lengthScale(roundScore, 35), lineHeight: ms(35, .5), color: fontColor }]}>
                            {roundScore}
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
                onPress={incPlayerRoundScoreHandler}><></></TouchableHighlight>

            <TouchableHighlight style={[styles.surface, styles.surfaceSubtract]}
                underlayColor={fontColor + '30'}
                activeOpacity={1}
                onPress={decPlayerRoundScoreHandler}><></></TouchableHighlight>
        </View>
    );
}

const styles = StyleSheet.create({
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
        fontVariant: ['tabular-nums'],
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