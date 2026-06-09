import React, { useState } from 'react';

import * as Haptics from 'expo-haptics';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { playerRoundScoreIncrement } from '../../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../../redux/selectors';
import { logEvent } from '../../../Analytics';
import { useMenuOpen } from '../../MenuOpenContext';
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
    showHint?: boolean;
};

export const HalfTileTouchSurface: React.FunctionComponent<Props> = (
    { playerIndex, fontColor, playerId, scoreType, showHint }: Props) => {

    const { menuOpen } = useMenuOpen();
    const showPointParticles = useAppSelector(state => state.settings.showPointParticles);
    const dispatch = useAppDispatch();

    const [particles, setParticles] = useState<ScoreParticleProps[]>([]);

    const primaryPointStep = useAppSelector(state => state.settings.addendOne);
    const secondaryPointStep = useAppSelector(state => state.settings.addendTwo);

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(selectCurrentGame);
    if (typeof currentGame == 'undefined') return null;

    const currentRoundIndex = currentGame.roundCurrent;

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
        if (menuOpen) return;

        if (showPointParticles) {
            addParticle(addend);
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        logEvent('score_change', {
            player_index: playerIndex,
            game_id: currentGameId,
            addend: addend,
            round: currentRoundIndex,
            type: scoreType,
            power_hold: powerHold,
            interaction: 'half-tap',
        });
        dispatch(playerRoundScoreIncrement(playerId, currentRoundIndex, scoreType == 'increment' ? addend : -addend));
    };

    return (
        <TouchableHighlight
            style={[styles.surface, scoreType == 'increment' ? styles.surfaceAdd : styles.surfaceSubtract]}
            underlayColor={currentGame.locked || menuOpen ? 'transparent' : fontColor + '30'}
            activeOpacity={menuOpen ? 1 : 1}
            onPress={() => scoreChangeHandler(primaryPointStep)}
            onLongPress={() => scoreChangeHandler(secondaryPointStep, true)}>
            <View style={[StyleSheet.absoluteFill,
                scoreType === 'increment' ? styles.hintContainerTop : styles.hintContainerBottom
            ]}>
                {showHint && (
                    <Text style={[styles.hintLabel, { color: fontColor }]}>
                        {scoreType === 'increment' ? '+' : '−'}
                    </Text>
                )}
                {particles.map((particle) => (
                    <ScoreParticle key={particle.key} id={particle.key} value={particle.value} />
                ))}
            </View>
        </TouchableHighlight>
    );
};

const styles = StyleSheet.create({
    surface: {
        position: 'absolute',
        width: '100%',
    },
    surfaceAdd: {
        top: 0,
        bottom: '50%',
    },
    surfaceSubtract: {
        top: '50%',
        bottom: 0,
    },
    hintContainerTop: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 8,
    },
    hintContainerBottom: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 8,
    },
    hintLabel: {
        fontSize: 42,
        fontWeight: '200',
        opacity: 0.2,
    },
});
