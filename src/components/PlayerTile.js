import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableHighlight } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import AdditionTile from './PlayerTiles/AdditionTile';
import { playerRoundScoreIncrement, playerRoundScoreDecrement, scoreAdd } from '../../redux/PlayersSlice';
import { selectScoreTotalByPlayer, selectScoreByPlayerAndRound } from '../../redux/ScoreSelectors';
import { createSelector, current } from '@reduxjs/toolkit';
import { selectPlayerById } from '../../redux/PlayersSlice';

const PlayerTile = ({ playerIndex, color, fontColor, cols, rows, playerId }) => {
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    const dispatch = useDispatch();

    const players = useSelector(state => state.currentGame.players);
    const currentRound = useSelector(state => state.currentGame.currentRound);
    const multiplier = useSelector(state => state.settings.multiplier);

    // New
    const player = useSelector(state => selectPlayerById(state, playerId))
    const playerName = player.playerName;
    const scoreTotal = player.scores.reduce(
        (sum, current, round) => {
            if (round > round) { return sum; }
            return (sum || 0) + (current || 0);
        }
    )
    const scoreRound = player.scores[currentRound];
    const incPlayerRoundScoreHandler = () => {
        dispatch(playerRoundScoreIncrement(playerId, currentRound, multiplier));
    }
    const decPlayerRoundScoreHandler = () => {
        dispatch(playerRoundScoreDecrement(playerId, currentRound, multiplier));
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
                totalScore={scoreTotal}
                roundScore={scoreRound}
                fontColor={fontColor}
                playerName={`${playerId.substr(0, 4)} ${playerName}`}
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

export default PlayerTile;
