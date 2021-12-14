import React from 'react';
import { Text, View, StyleSheet, TouchableHighlight } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { s, vs, ms, mvs } from 'react-native-size-matters';

import { incPlayerRoundScore, decPlayerRoundScore } from '../../redux/CurrentGameActions';

const PlayerScore = ({ playerIndex, color, fontColor, cols, rows }) => {
    const players = useSelector(state => state.currentGame.players);
    const scores = useSelector(state => state.currentGame.scores);
    const currentRound = useSelector(state => state.currentGame.currentRound);
    const multiplier = useSelector(state => state.settings.multiplier);
    const dispatch = useDispatch();

    const totalScore = scores[playerIndex].reduce(
        (a, b) => { return (a || 0) + (b || 0); }
    );

    const roundScore = scores[playerIndex][currentRound] || 0

    const incPlayerRoundScoreHandler = () => {
        dispatch(incPlayerRoundScore(playerIndex, multiplier));
    }

    const decPlayerRoundScoreHandler = () => {
        dispatch(decPlayerRoundScore(playerIndex, multiplier));
    }

    const width = (100 / cols) + '%';
    const height = (100 / rows) + '%';

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
        <View style={[styles.playerCard,
        { backgroundColor: color },
        { width: width },
        { height: height },
        ]}>

            <View style={{ padding: 10 }}>
                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <Text numberOfLines={1} style={[styles.name, { fontSize: nameLengthScale(), lineHeight: s(30), color: fontColor }]}>
                        {players[playerIndex].name}
                    </Text>
                </View>
                <View>
                    <Text style={[styles.totalScore, { fontSize: lengthScale(totalScore, 55), lineHeight: ms(55, .5), color: fontColor }]}>
                        {totalScore}
                    </Text>
                    {roundScore != 0 &&
                        <View style={[styles.roundBox, { borderColor: fontColor + '75', padding: ms(5, .4) }]}>
                            <Text numberOfLines={1}
                                style={[styles.roundScore, { color: fontColor + '75', fontSize: lengthScale(roundScore, 35), lineHeight: ms(25, .5) },]}>
                                {roundScore > 0 && "+"} {roundScore}
                            </Text>
                            <Text style={[styles.label, styles.totalLabel, { color: fontColor + '75' }]}>
                                this round
                            </Text>
                        </View>
                    }
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
    roundScore: {
        margin: 2,
        textAlign: 'center',
        color: 'white',
        fontVariant: ['tabular-nums'],
    },
    roundBox: {
        // padding: 5,
        padding: 10,
        borderRadius: 5,
        borderWidth: 2,
        alignSelf: 'center'
    },
    totalScore: {
        fontVariant: ['tabular-nums'],
        fontWeight: 'bold',
        alignSelf: 'center',
        margin: 0,
        marginTop: 0,
        padding: 0,
    },
    label: {
        textAlign: 'center',
        alignSelf: 'center',
        color: 'white',
    },
    totalLabel: {
        fontVariant: ['tabular-nums'],
        alignSelf: 'center',
        textAlign: 'center',
    },
});

export default PlayerScore;