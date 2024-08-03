import React, { useState } from 'react';

import * as Haptics from 'expo-haptics';
import { StyleSheet, TouchableHighlight, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { playerRoundScoreIncrement } from '../../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../../redux/selectors';
import { logEvent } from '../../../Analytics';
import { ScoreParticle } from '../../PlayerTiles/AdditionTile/ScoreParticle';

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

export const HalfTileTouchSurface: React.FunctionComponent<Props> = (
    { playerIndex, fontColor, playerId, scoreType }: Props) => {

    const showPointParticles = useAppSelector(state => state.settings.showPointParticles);
    const dispatch = useAppDispatch();

    const [particles, setParticles] = useState<ScoreParticleProps[]>([]);

    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(selectCurrentGame);
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

    const scoreChangeHandler = (addend: number, powerHold = false) => {
        if (currentGame.locked) return;

        if (showPointParticles) {
            addParticle(addend);
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        logEvent('score_change', {
            player_index: playerIndex,
            game_id: currentGameId,
            addend: addend,
            round: roundCurrent,
            type: scoreType,
            power_hold: powerHold,
            interaction: 'half-tap',
        });
        dispatch(playerRoundScoreIncrement(playerId, roundCurrent, scoreType == 'increment' ? addend : -addend));
    };

    return (
        <TouchableHighlight
            style={[styles.surface, scoreType == 'increment' ? styles.surfaceAdd : styles.surfaceSubtract]}
            underlayColor={currentGame.locked ? 'transparent' : fontColor + '30'}
            activeOpacity={1}
            onPress={() => scoreChangeHandler(addendOne)}
            onLongPress={() => scoreChangeHandler(addendTwo, true)}>
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
