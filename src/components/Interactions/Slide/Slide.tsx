import React, { useEffect, useRef, useState } from 'react';

import analytics from '@react-native-firebase/analytics';
import * as Haptics from 'expo-haptics';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { selectGameById } from '../../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { playerRoundScoreIncrement } from '../../../../redux/PlayersSlice';

interface HalfTapProps {
    children: React.ReactNode;
    fontColor: string;
    index: number;
    playerId: string;
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
    const dispatch = useAppDispatch();

    // Hold for addendTwo
    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);

    const [maxHoldReached, setMaxHoldReached] = useState<boolean>(false);

    const maxHoldTime = 400;
    const maxHoldReachedRef = useRef(maxHoldReached);

    useEffect(() => {
        maxHoldReachedRef.current = maxHoldReached;
    }, [maxHoldReached]);

    const holdTime = useRef(new Animated.Value(0)).current;

    const scale = holdTime.interpolate({
        inputRange: [0, maxHoldTime * .9, maxHoldTime],
        outputRange: [1, 1.1, 1.05],
        extrapolate: 'clamp',
    });

    const glow = holdTime.interpolate({
        inputRange: [0, maxHoldTime],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    // Panning
    const pan = useRef(new Animated.ValueXY()).current;
    const totalOffset = useSharedValue<number | null>(0);

    const scoreChangeHandler = (value: number) => {
        if (Math.abs(value) == 0) return;

        const a = value * (maxHoldReached ? addendTwo : addendOne);

        if (maxHoldReached) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        analytics().logEvent('score_change', {
            player_index: index,
            game_id: currentGameId,
            addend: Math.abs(a),
            round: roundCurrent,
            type: a > 0 ? 'increment' : 'decrement',
            interaction: 'slide',
        });

        dispatch(playerRoundScoreIncrement(playerId, roundCurrent, a));
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

    let timer: NodeJS.Timeout;

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderStart: () => {
                // Reset the state of the gesture
                totalOffset.value = null;

                // Reset 
                Animated.timing(holdTime, {
                    toValue: maxHoldTime,
                    duration: maxHoldTime,
                    useNativeDriver: false,
                }).start();

                timer = setTimeout(() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    setMaxHoldReached(true);
                }, maxHoldTime * .8);
            },
            onPanResponderMove: (e, gestureState) => {
                // Invert the value for panning up to be positive
                totalOffset.value = -gestureState.dy;

                // Animate the slider to follow the touch
                Animated.event(
                    [null, { dy: pan.y }],
                    { useNativeDriver: false }
                )(e, gestureState);

                clearTimeout(timer);

                if (maxHoldReachedRef.current == false) {
                    Animated.timing(holdTime, {
                        toValue: 0,
                        duration: 100,
                        useNativeDriver: false,
                    }).start();
                }
            },
            onPanResponderRelease: () => {
                // Reset the state of the gesture
                totalOffset.value = null;

                // Spring the animation back to the start
                Animated.spring(pan, {
                    toValue: { x: 0, y: 0 },
                    bounciness: 0,
                    useNativeDriver: false
                }).start();

                Animated.timing(holdTime, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                }).start();

                clearTimeout(timer);
                // Toggle to addendOne
                setMaxHoldReached(false);
            },
        })
    ).current;

    return (
        <>
            <Animated.View style={[
                {
                    transform: [{
                        scale: scale,
                    }],
                    shadowOpacity: glow,
                },
                styles.sliderGlow
            ]}>
                {children}
            </Animated.View>

            <Animated.View
                style={[
                    StyleSheet.absoluteFillObject,
                    {
                        transform: [
                            { translateX: pan.x },
                            { translateY: pan.y },
                        ],
                    }]}
                {...(currentGame.locked ? {} : panResponder.panHandlers)}>
                <View style={[styles.slider, styles.sliderTop]} />
                <View style={[styles.slider, styles.sliderBottom]} />
            </Animated.View>
        </>
    );
};

export default Slide;

const styles = StyleSheet.create({
    slider: {
        position: 'absolute',
        left: 0,
        width: '100%',
        height: 1000,
    },
    sliderTop: {
        top: -1000,
        backgroundColor: 'rgba(0,0,0,0.25)'
    },
    sliderBottom: {
        top: '100%',
        backgroundColor: 'rgba(255,255,255,0.25)'
    },
    sliderGlow: {
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 2,
        backgroundColor: 'transparent',
    },
});
