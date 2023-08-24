import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableHighlight, LayoutChangeEvent, DimensionValue } from 'react-native';
import { useDispatch } from 'react-redux';
import analytics from '@react-native-firebase/analytics';
import Animated, { FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import AdditionTile from './PlayerTiles/AdditionTile/AdditionTile';
import { playerRoundScoreIncrement } from '../../redux/PlayersSlice';
import { selectGameById } from '../../redux/GamesSlice';
import { selectPlayerById } from '../../redux/PlayersSlice';
import { useAppSelector } from '../../redux/hooks';
import { ScoreParticle } from './PlayerTiles/ScoreParticle';

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

    const [particles, setParticles] = useState<object[]>([]);

    const addParticle = () => {
        const key = Math.random().toString(36).substring(7);
        const value = `+${multiplier}`;

        setTimeout(() => {
            setParticles((particles) => particles.filter((p) => p.key !== key));
        }, 3000);
        setParticles((particles) => [...particles, { key, value }]);
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

            <TouchableHighlight
                style={[styles.surface, styles.surfaceAdd]}
                underlayColor={fontColor + '30'}
                activeOpacity={1}
                onPressIn={incPlayerRoundScoreHandler}>
                <View style={{ height: '100%', width: '100%' }}>
                    {particles.map((particle) => (
                        <ScoreParticle key={particle.key} value={particle.value} />
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
