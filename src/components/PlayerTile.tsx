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

const Particle: React.FunctionComponent = React.memo(({ id, value }) => {
    const randomTop: DimensionValue = `${Math.floor(Math.random() * 30 + 0)}%`;
    const randomLeft: DimensionValue = `${Math.floor(Math.random() * 70 + 10)}%`;
    const randomRotation: string = `${Math.floor(Math.random() * 30) - 15}deg`;
    let color = 'gold';
    switch (value) {
        case '+1': color = 'green'; break;
        case '+5': color = 'blue'; break;
        case '+10': color = 'red'; break;
    }

    return <Animated.View style={{
        position: 'absolute',
        top: randomTop,
        left: randomLeft,
        transform: [{ rotate: randomRotation }],
        backgroundColor: color,
        opacity: 0.7,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: 'black',
        padding: 5,
    }}
        // entering={ZoomInEasyUp}
        exiting={FadeOut.withInitialValues({ opacity: 0.7 })}
    >
        <Text style={{
            color: 'black', fontSize: 30, fontWeight: 'bold'
        }}>{value}</Text>
    </Animated.View>;
});

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
                onPressIn={incPlayerRoundScoreHandler}>
                <View style={{ height: '100%', width: '100%' }}>
                    {particles.map((particle) => (
                        <Particle key={particle.key} value={particle.value} />
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
