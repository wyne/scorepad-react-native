import React, { useState, memo } from 'react';
import { Text, View, StyleSheet, TouchableHighlight } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import AdditionTile from './PlayerTiles/AdditionTile';
import { playerRoundScoreIncrement, playerRoundScoreDecrement, playerAdd, updatePlayer } from '../../redux/PlayersSlice';
import { selectGameById } from '../../redux/GamesSlice';
import { selectPlayerById } from '../../redux/PlayersSlice';

const PlayerTile = ({ color, fontColor, cols, rows, playerId, index }) => {
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    const dispatch = useDispatch();

    const multiplier = useSelector(state => state.settings.multiplier);
    const currentGameId = useSelector(state => state.settings.currentGameId);
    const roundCurrent = useSelector(state => selectGameById(state, currentGameId).roundCurrent);

    // New
    const player = useSelector(state => selectPlayerById(state, playerId));
    const playerName = player.playerName;
    const scoreTotal = player.scores.reduce(
        (sum, current, round) => {
            if (round > roundCurrent) { return sum; }
            return (sum || 0) + (current || 0);
        }
    );
    const scoreRound = player.scores[roundCurrent] || 0;

    const incPlayerRoundScoreHandler = () => {
        dispatch(playerRoundScoreIncrement(playerId, roundCurrent, multiplier));
    };
    const decPlayerRoundScoreHandler = () => {
        dispatch(playerRoundScoreIncrement(playerId, roundCurrent, -multiplier));
    };

    const widthPerc = (100 / cols) + '%';
    const heightPerc = (100 / rows) + '%';

    const layoutHandler = (e) => {
        var { x, y, width, height } = e.nativeEvent.layout;

        setWidth(width);
        setHeight(height);
    };

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
                totalScore={scoreTotal}
                roundScore={scoreRound}
                fontColor={fontColor}
                playerName={playerName}
                maxWidth={width}
                maxHeight={height}
                index={index}
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
};

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

export default PlayerTile;
