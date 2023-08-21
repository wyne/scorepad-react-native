import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableHighlight, LayoutChangeEvent, DimensionValue } from 'react-native';
import { useDispatch } from 'react-redux';
import analytics from '@react-native-firebase/analytics';
import Animated, { FadeOut } from 'react-native-reanimated';

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

    const [particles, setParticles] = useState<JSX.Element[]>([]);

    const addParticle = () => {
        const randomTop: DimensionValue = `${Math.floor(Math.random() * 30 + 0)}%`;
        const randomLeft: DimensionValue = `${Math.floor(Math.random() * 70 + 10)}%`;
        const randomRotation: string = `${Math.floor(Math.random() * 30) - 15}deg`;

        const particle = <Animated.View style={{
            position: 'absolute',
            top: randomTop,
            left: randomLeft,
            transform: [{ rotate: randomRotation }],
            backgroundColor: 'gold',
            opacity: 0.7,
            borderRadius: 100,
            borderWidth: 2,
            borderColor: 'black',
            padding: 5,
        }}
            entering={FadeOut.delay(900).withInitialValues({ opacity: 0.9 })}
        >
            <Text style={{
                color: 'black', fontSize: 40, fontWeight: 'bold'
            }}>+1</Text>
        </Animated.View>;
        setParticles([...particles, particle]);
    };


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
        addParticle();

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

    type Percent = `${number}%`;
    const widthPerc: Percent = `${(100 / cols)}%`;
    const heightPerc: Percent = `${(100 / rows)}%`;

    const layoutHandler = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;

        setWidth(width);
        setHeight(height);
    };

    return (
        <View style={[
            styles.playerCard,
            { backgroundColor: color },
            { width: widthPerc },
            { height: heightPerc },
        ]}
            onLayout={layoutHandler}>
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
                <View style={{ height: '100%', width: '100%' }}>
                    {particles.map((particle, index) => (
                        <>{particle}</>
                    ))}
                </View>
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
