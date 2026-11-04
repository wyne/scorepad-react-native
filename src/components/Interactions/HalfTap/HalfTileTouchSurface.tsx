import React, { useState } from 'react';

import * as Haptics from 'expo-haptics';
import { GestureResponderEvent, StyleSheet, TouchableHighlight, View } from 'react-native';

import { selectGameById } from '../../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector, useAppStore } from '../../../../redux/hooks';
import { playerRoundScoreIncrement } from '../../../../redux/PlayersSlice';
import { setLastUsedInteractionType } from '../../../../redux/SettingsSlice';
import { logEvent } from '../../../Analytics';
import { useLockedHint } from '../../LockedHintContext';
import { useMenuOpen } from '../../MenuOpenContext';
import { PARTICLE_DURATION, ScoreParticle } from '../../PlayerTiles/AdditionTile/ScoreParticle';
import { InteractionType } from '../InteractionType';

type ScoreParticleProps = {
    key: string;
    value: string;
    x: number;
    y: number;
    large: boolean;
};

type Props = {
    playerIndex: number;
    playerId: string;
    fontColor: string;
    scoreType: 'increment' | 'decrement';
    /** Test-only render probe for selector invalidation regressions. */
    onRender?: (id: string) => void;
};

export const HalfTileTouchSurface: React.FunctionComponent<Props> = (
    { playerIndex, fontColor, playerId, scoreType, onRender }: Props) => {
    onRender?.(playerId);

    const { menuOpen } = useMenuOpen();
    const { showLockedHint } = useLockedHint();
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

    const addParticle = (addend: number, event: GestureResponderEvent | undefined, large: boolean) => {
        const key = Math.random().toString(36).substring(7);
        const value = `${scoreType == 'increment' ? '+' : '−'}${addend}`;
        const x = event?.nativeEvent?.locationX ?? 0;
        const y = event?.nativeEvent?.locationY ?? 0;

        setTimeout(() => {
            setParticles((particles) => particles.filter((p) => p.key !== key));
        }, PARTICLE_DURATION + 50);
        setParticles((particles) => [...particles, { key, value, x, y, large }]);
    };

    const scoreChangeHandler = (addend: number, event?: GestureResponderEvent, secondaryHold = false) => {
        if (menuOpen) return;
        if (currentGameLocked) {
            showLockedHint();
            return;
        }
        const currentRoundIndex = getCurrentRoundIndex();

        if (showPointParticles) {
            addParticle(addend, event, secondaryHold);
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
        dispatch(setLastUsedInteractionType(InteractionType.HalfTap));
    };

    return (
        <TouchableHighlight
            style={[styles.surface, scoreType == 'increment' ? styles.surfaceAdd : styles.surfaceSubtract]}
            underlayColor={currentGameLocked || menuOpen ? 'transparent' : fontColor + '30'}
            activeOpacity={menuOpen ? 1 : 1}
            onPress={(e) => scoreChangeHandler(addendOne, e)}
            onLongPress={(e) => scoreChangeHandler(addendTwo, e, true)}>
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {particles.map((particle) => (
                    <ScoreParticle
                        key={particle.key}
                        value={particle.value}
                        x={particle.x}
                        y={particle.y}
                        direction={scoreType === 'increment' ? 'up' : 'down'}
                        color={fontColor}
                        large={particle.large}
                    />
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
});
