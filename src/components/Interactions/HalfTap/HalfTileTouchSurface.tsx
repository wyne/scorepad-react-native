import React, { useState } from 'react';

import * as Haptics from 'expo-haptics';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import { selectGameById } from '../../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector, useAppStore } from '../../../../redux/hooks';
import { playerRoundScoreIncrement } from '../../../../redux/PlayersSlice';
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
    /** Test-only render probe for selector invalidation regressions. */
    onRender?: (id: string) => void;
};

export const HalfTileTouchSurface: React.FunctionComponent<Props> = (
    { playerIndex, fontColor, playerId, scoreType, showHint, onRender }: Props) => {
    onRender?.(playerId);

    const { menuOpen } = useMenuOpen();
    const showPointParticles = useAppSelector(state => state.settings.showPointParticles);
    const dispatch = useAppDispatch();
    const store = useAppStore();

    const [particles, setParticles] = useState<ScoreParticleProps[]>([]);

    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGameLocked = useAppSelector(state => {
        const currentGameId = state.settings.currentGameId;
        return currentGameId ? selectGameById(state, currentGameId)?.locked === true : false;
    });
    const hasCurrentGame = useAppSelector(state => {
        const currentGameId = state.settings.currentGameId;
        return currentGameId ? typeof selectGameById(state, currentGameId) !== 'undefined' : false;
    });
    if (!hasCurrentGame) return null;

    const getCurrentRoundIndex = () => {
        const state = store.getState();
        const currentGameId = state.settings.currentGameId;
        return currentGameId ? selectGameById(state, currentGameId)?.roundCurrent ?? 0 : 0;
    };

    const addParticle = (addend: number) => {
        const key = Math.random().toString(36).substring(7);
        const value = `${scoreType == 'increment' ? '+' : '-'}${addend}`;

        setTimeout(() => {
            setParticles((particles) => particles.filter((p) => p.key !== key));
        }, 800);
        setParticles((particles) => [...particles, { key, value }]);
    };

    const scoreChangeHandler = (addend: number, secondaryHold = false) => {
        if (currentGameLocked) return;
        if (menuOpen) return;
        const currentRoundIndex = getCurrentRoundIndex();

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
            power_hold: secondaryHold,
            interaction: 'half-tap',
        });
        dispatch(playerRoundScoreIncrement(playerId, currentRoundIndex, scoreType == 'increment' ? addend : -addend));
    };

    return (
        <TouchableHighlight
            style={[styles.surface, scoreType == 'increment' ? styles.surfaceAdd : styles.surfaceSubtract]}
            underlayColor={currentGameLocked || menuOpen ? 'transparent' : fontColor + '30'}
            activeOpacity={menuOpen ? 1 : 1}
            onPress={() => scoreChangeHandler(addendOne)}
            onLongPress={() => scoreChangeHandler(addendTwo, true)}>
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
