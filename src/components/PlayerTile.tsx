import React, { useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent, DimensionValue } from 'react-native';

import AdditionTile from './PlayerTiles/AdditionTile/AdditionTile';
import { selectGameById } from '../../redux/GamesSlice';
import { selectPlayerById } from '../../redux/PlayersSlice';
import { useAppSelector } from '../../redux/hooks';
import { TouchSurface } from './PlayerTiles/AdditionTile/TouchSurface';

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

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(state => selectGameById(state, currentGameId));
    if (typeof currentGame == 'undefined') return null;

    const roundCurrent = currentGame.roundCurrent;

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

    const widthPerc: DimensionValue = `${(100 / cols)}%`;
    const heightPerc: DimensionValue = `${(100 / rows)}%`;

    const layoutHandler = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;

        setWidth(width);
        setHeight(height);
    };

    console.log("PlayerTile, width=", width);

    return (
        <View onLayout={layoutHandler}
            style={[
                styles.playerCard,
                { backgroundColor: color },
                { width: widthPerc },
                { height: heightPerc },
            ]}>
            <AdditionTile
                totalScore={scoreTotal}
                roundScore={scoreRound}
                fontColor={fontColor}
                playerName={playerName}
                maxWidth={width}
                maxHeight={height}
                index={index}
            />

            <TouchSurface
                scoreType='increment'
                fontColor={fontColor}
                playerId={playerId}
                playerIndex={index} />

            <TouchSurface
                scoreType='decrement'
                fontColor={fontColor}
                playerId={playerId}
                playerIndex={index} />
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
