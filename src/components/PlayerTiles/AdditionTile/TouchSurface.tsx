import React, { useState } from 'react';
import { StyleSheet, TouchableHighlight, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import analytics from '@react-native-firebase/analytics';

import { playerRoundScoreIncrement } from '../../../../redux/PlayersSlice';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { selectGameById } from '../../../../redux/GamesSlice';

import { ScoreParticle } from './ScoreParticle';

type ScoreParticleProps = {
    key: string;
    value: string;
};

type Props = {
    playerIndex: number;
    playerId: string;
    fontColor: string;
    scoreType: 'increment' | 'decrement';
};

export const TouchSurface: React.FunctionComponent<Props> = (
    { playerIndex, fontColor, playerId, scoreType }: Props) => {

    const showPointParticles = useAppSelector(state => state.settings.showPointParticles);
    const dispatch = useAppDispatch();

    const [particles, setParticles] = useState<ScoreParticleProps[]>([]);

    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(state => selectGameById(state, currentGameId));
    if (typeof currentGame == 'undefined') return null;

    const roundCurrent = currentGame.roundCurrent;

    const addParticle = (addend: number) => {
        const key = Math.random().toString(36).substring(7);
        const value = `${scoreType == 'increment' ? '+' : '-'}${addend}`;

        setTimeout(() => {
            setParticles((particles) => particles.filter((p) => p.key !== key));
        }, 800);
        setParticles((particles) => [...particles, { key, value }]);
    };

    const scoreChangeHandler = (addend: number) => {
        if (currentGame.locked) return;

        if (showPointParticles) {
            addParticle(addend);
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        analytics().logEvent('score_change', {
            player_index: playerIndex,
            game_id: currentGameId,
            addend: addend,
            round: roundCurrent,
            type: scoreType,
        });
        dispatch(playerRoundScoreIncrement(playerId, roundCurrent, scoreType == 'increment' ? addend : -addend));
    };

    return (
        <TouchableHighlight
            style={[styles.surface, scoreType == 'increment' ? styles.surfaceAdd : styles.surfaceSubtract]}
            underlayColor={currentGame.locked ? 'transparent' : fontColor + '30'}
            activeOpacity={1}
            onPress={() => scoreChangeHandler(addendOne)}
            onLongPress={() => scoreChangeHandler(addendTwo)}>
            <View style={[StyleSheet.absoluteFill]}>
                {particles.map((particle) => (
                    <ScoreParticle key={particle.key} id={particle.key} value={particle.value} />
                ))}
            </View>
        </TouchableHighlight>
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
