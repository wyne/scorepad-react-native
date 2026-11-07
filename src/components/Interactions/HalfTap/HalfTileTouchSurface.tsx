import React, { useRef, useState } from 'react';

import * as Haptics from 'expo-haptics';
import { GestureResponderEvent, LayoutChangeEvent, StyleSheet, TouchableHighlight, View } from 'react-native';

import { selectGameById } from '../../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector, useAppStore } from '../../../../redux/hooks';
import { playerRoundScoreIncrement } from '../../../../redux/PlayersSlice';
import { setLastUsedInteractionType } from '../../../../redux/SettingsSlice';
import { logEvent } from '../../../Analytics';
import { useGestureNudge } from '../../GestureNudgeContext';
import { useLockedHint } from '../../LockedHintContext';
import { useMenuOpen } from '../../MenuOpenContext';
import { PARTICLE_DURATION, ScoreParticle } from '../../PlayerTiles/AdditionTile/ScoreParticle';
import { InteractionType } from '../InteractionType';

/** How far a touch must drag, in points, to count as a swipe. */
const SWIPE_MISS_DISTANCE = 20;

type ScoreParticleProps = {
    key: string;
    value: string;
    x: number;
    y: number;
    large: boolean;
    containerWidth: number;
    containerHeight: number;
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
    const surfaceSize = useRef({ width: 0, height: 0 });

    // A touch that drags 20pt or more and is released without scoring is
    // someone swiping in tap mode: tell the nudge toast. Judged on the touch's
    // own end, since onPressOut also fires when a finger only leaves the
    // press area and may come back to score.
    const { reportMiss, reportSuccess } = useGestureNudge();
    const touchStart = useRef<{ x: number; y: number } | null>(null);
    const scoredThisTouch = useRef(false);

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
        const { width: containerWidth, height: containerHeight } = surfaceSize.current;
        const x = event?.nativeEvent?.locationX ?? containerWidth / 2;
        const y = event?.nativeEvent?.locationY ?? containerHeight / 2;

        setTimeout(() => {
            setParticles((particles) => particles.filter((p) => p.key !== key));
        }, PARTICLE_DURATION + 50);
        setParticles((particles) => [...particles, {
            key, value, x, y, large, containerWidth, containerHeight
        }]);
    };

    const onLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        surfaceSize.current = { width, height };
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
        scoredThisTouch.current = true;
        reportSuccess();
    };

    const onTouchStart = (event: GestureResponderEvent) => {
        touchStart.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY };
        scoredThisTouch.current = false;
    };

    const onTouchEnd = (event: GestureResponderEvent) => {
        const start = touchStart.current;
        touchStart.current = null;
        if (!start || menuOpen || currentGameLocked) return;
        const moved = Math.hypot(event.nativeEvent.pageX - start.x, event.nativeEvent.pageY - start.y);
        if (moved < SWIPE_MISS_DISTANCE) return;
        // The same release may still deliver onPress; let it run first.
        setTimeout(() => {
            if (!scoredThisTouch.current) reportMiss(InteractionType.HalfTap);
        }, 0);
    };

    const onTouchCancel = () => {
        touchStart.current = null;
    };

    return (
        <TouchableHighlight
            style={[styles.surface, scoreType == 'increment' ? styles.surfaceAdd : styles.surfaceSubtract]}
            underlayColor={currentGameLocked || menuOpen ? 'transparent' : fontColor + '30'}
            activeOpacity={menuOpen ? 1 : 1}
            onLayout={onLayout}
            onPress={(e) => scoreChangeHandler(addendOne, e)}
            onLongPress={(e) => scoreChangeHandler(addendTwo, e, true)}>
            {/* box-only makes this view the touch target, so its touch events
                fire for the whole touch while the Touchable handles presses. */}
            <View
                style={StyleSheet.absoluteFill}
                pointerEvents="box-only"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onTouchCancel={onTouchCancel}
                testID="half-tap-touch-area"
            >
                {particles.map((particle) => (
                    <ScoreParticle
                        key={particle.key}
                        value={particle.value}
                        x={particle.x}
                        y={particle.y}
                        direction={scoreType === 'increment' ? 'up' : 'down'}
                        color={fontColor}
                        large={particle.large}
                        containerWidth={particle.containerWidth}
                        containerHeight={particle.containerHeight}
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
