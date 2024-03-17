import React, { useRef } from 'react';

import analytics from '@react-native-firebase/analytics';
import * as Haptics from 'expo-haptics';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { selectGameById } from '../../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { playerRoundScoreIncrement } from '../../../../redux/PlayersSlice';

interface HalfTapProps {
    index: number;
    playerId: string;
    children: React.ReactNode;
}

const Slide: React.FC<HalfTapProps> = ({
    children,
    index,
    playerId,
}) => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(state => selectGameById(state, currentGameId));
    if (typeof currentGame == 'undefined') return null;

    const roundCurrent = currentGame.roundCurrent;

    const pan = useRef(new Animated.ValueXY()).current;
    const totalOffset = useSharedValue<number | null>(0);

    const addendOne = useAppSelector(state => state.settings.addendOne);

    const dispatch = useAppDispatch();

    const scoreChangeHandler = (value: number) => {
        if (currentGame.locked) return;

        const addend = value > 0 ? addendOne : -addendOne;

        if (Math.abs(value) == 0) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        analytics().logEvent('score_change', {
            player_index: index,
            game_id: currentGameId,
            addend: Math.abs(addend),
            round: roundCurrent,
            type: addend > 0 ? 'increment' : 'decrement',
            interaction: 'slide',
        });

        dispatch(playerRoundScoreIncrement(playerId, roundCurrent, addend));
    };

    useAnimatedReaction(
        () => {
            return totalOffset.value;
        },
        (currentValue, previousValue) => {
            if (currentValue === null) return;

            const c = Math.round((currentValue || 0) / 50);
            const p = Math.round((previousValue || 0) / 50);
            if (c - p !== 0) {
                runOnJS(scoreChangeHandler)(c - p);
            }
        }
    );

    const panResponder = useRef(
        PanResponder.create({
            onPanResponderStart: () => {
                totalOffset.value = null;
            },
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (e, gestureState) => {
                totalOffset.value = -gestureState.dy;

                Animated.event(
                    [null, { dy: pan.y }],
                    { useNativeDriver: false }
                )(e, gestureState);
            },
            onPanResponderRelease: (e, gestureState) => {
                Animated.spring(pan, {
                    toValue: { x: 0, y: 0 },
                    bounciness: 0,
                    useNativeDriver: false
                }).start();
                totalOffset.value = null;
            },
        }),
    ).current;

    return (
        <>
            {children}
            <Animated.View
                style={[
                    StyleSheet.absoluteFillObject,
                    {
                        transform: [{ translateX: pan.x }, { translateY: pan.y }],
                    }]}
                {...panResponder.panHandlers}>
                <View style={{ height: 900, width: '100%', backgroundColor: 'rgba(0,0,0,.25)', top: -900, left: 0, position: 'absolute' }}></View>
                <View style={{ height: 900, width: '100%', backgroundColor: 'rgba(255,255,255,.25)', top: '100%', left: 0, position: 'absolute' }}></View>
            </Animated.View>
        </>
    );
};

export default Slide;
