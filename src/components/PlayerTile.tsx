import React, { useState } from 'react';
import { View, StyleSheet, TouchableHighlight, LayoutChangeEvent } from 'react-native';
import { useDispatch } from 'react-redux';
import analytics from '@react-native-firebase/analytics';

import AdditionTile from './PlayerTiles/AdditionTile/AdditionTile';
import { playerRoundScoreIncrement } from '../../redux/PlayersSlice';
import { selectGameById } from '../../redux/GamesSlice';
import { selectPlayerById } from '../../redux/PlayersSlice';
import { useAppSelector } from '../../redux/hooks';

interface Props {
    color: string;
    fontColor: string;
    cols: number;
    rows: number;
    playerId: string;
    index: number;
}

const PlayerTile: React.FunctionComponent<Props> = ({ color, fontColor, cols, rows, playerId, index }) => {
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);

    const dispatch = useDispatch();

    const multiplier = useAppSelector(state => state.settings.multiplier);
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(state => selectGameById(state, currentGameId));
    if (typeof currentGame == 'undefined') return null;

    const roundCurrent = currentGame.roundCurrent;

    // New
    const player = useAppSelector(state => selectPlayerById(state, playerId));

    if (typeof player == 'undefined') return null;

    const playerName = player.playerName;
    const scoreTotal = player.scores.reduce(
        (sum, current, round) => {
            if (round > roundCurrent) { return sum; }
            return (sum || 0) + (current || 0);
        }
    );
    const scoreRound = player.scores[roundCurrent] || 0;

    const incPlayerRoundScoreHandler = () => {
        analytics().logEvent('score_change', {
            player_index: index,
            game_id: currentGameId,
            multiplier: multiplier,
            round: roundCurrent,
            type: 'increment'
        });
        dispatch(playerRoundScoreIncrement(playerId, roundCurrent, multiplier));
    };
    const decPlayerRoundScoreHandler = () => {
        analytics().logEvent('score_change', {
            player_index: index,
            game_id: currentGameId,
            multiplier: multiplier,
            round: roundCurrent,
            type: 'decrement'
        });
        dispatch(playerRoundScoreIncrement(playerId, roundCurrent, -multiplier));
    };

    const widthPerc = (100 / cols) + '%';
    const heightPerc = (100 / rows) + '%';

    const layoutHandler = (e: LayoutChangeEvent) => {
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
