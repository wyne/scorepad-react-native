import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableHighlight } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import AdditionTile from './PlayerTiles/AdditionTile';
import { incPlayerRoundScore, decPlayerRoundScore } from '../../redux/CurrentGameActions';

const PlayerScore = ({ playerIndex, color, fontColor, cols, rows }) => {
    const players = useSelector(state => state.currentGame.players);
    const scores = useSelector(state => state.currentGame.scores);
    const currentRound = useSelector(state => state.currentGame.currentRound);
    const multiplier = useSelector(state => state.settings.multiplier);
    const dispatch = useDispatch();

    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    const totalScore = scores[playerIndex].reduce(
        (sum, current, round) => {
            if (round > currentRound) { return sum; }
            return (sum || 0) + (current || 0);
        }
    );

    const roundScore = scores[playerIndex][currentRound] || 0

    const incPlayerRoundScoreHandler = () => {
        dispatch(incPlayerRoundScore(playerIndex, multiplier));
    }

    const decPlayerRoundScoreHandler = () => {
        dispatch(decPlayerRoundScore(playerIndex, multiplier));
    }

    const widthPerc = (100 / cols) + '%';
    const heightPerc = (100 / rows) + '%';

    const layoutHandler = (e) => {
        var { x, y, width, height } = e.nativeEvent.layout;

        setWidth(width);
        setHeight(height);
    }

    return (
        <View
            style={[
                styles.playerCard,
                { backgroundColor: color },
                { width: widthPerc },
                { height: heightPerc },
            ]}
            onLayout={layoutHandler}
        >

            <AdditionTile
                totalScore={totalScore}
                roundScore={roundScore}
                fontColor={fontColor}
                playerName={players[playerIndex].name}
                maxWidth={width}
                maxHeight={height}
            />

            <TouchableHighlight
                style={[styles.surface, styles.surfaceAdd]}
                underlayColor={fontColor + '30'}
                activeOpacity={1}
                onPress={incPlayerRoundScoreHandler}>
                <></>
            </TouchableHighlight>

            <TouchableHighlight
                style={[styles.surface, styles.surfaceSubtract]}
                underlayColor={fontColor + '30'}
                activeOpacity={1}
                onPress={decPlayerRoundScoreHandler}>
                <></>
            </TouchableHighlight>
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
});

export default PlayerScore;