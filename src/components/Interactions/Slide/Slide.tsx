import React, { useEffect, useRef, useState } from 'react';

import analytics from '@react-native-firebase/analytics';
import * as Haptics from 'expo-haptics';
import { Animated, StyleSheet, View } from 'react-native';
import { PanGestureHandler, PanGestureHandlerStateChangeEvent, State } from 'react-native-gesture-handler';
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
    // Selector setup

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGame = useAppSelector(state => selectGameById(state, currentGameId));
    if (typeof currentGame == 'undefined') return null;

    const roundCurrent = currentGame.roundCurrent;
    const dispatch = useAppDispatch();

    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);

    // Power Hold

    const powerHoldTime = 400;
    const holdDuration = useRef(new Animated.Value(0)).current;
    let powerHoldTimer: NodeJS.Timeout;
    const [powerHold, setPowerHold] = useState<boolean>(false);
    const powerHoldRef = useRef(powerHold);
    useEffect(() => {
        powerHoldRef.current = powerHold;
    }, [powerHold]);

    // Derivated Animation values

    const scale = holdDuration.interpolate({
        inputRange: [0, powerHoldTime * .9, powerHoldTime],
        outputRange: [1, 1.1, 1.05],
        extrapolate: 'clamp',
    });

    const glow = holdDuration.interpolate({
        inputRange: [0, powerHoldTime],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const powerHoldStart = () => {
        Animated.timing(holdDuration, {
            toValue: powerHoldTime,
            duration: powerHoldTime,
            useNativeDriver: false,
        }).start();

        powerHoldTimer = setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setPowerHold(true);
        }, powerHoldTime * .8);
    };

    const powerHoldStop = () => {
        Animated.timing(holdDuration, {
            toValue: 0,
            duration: 100,
            useNativeDriver: false,
        }).start();

        setPowerHold(false);

        clearTimeout(powerHoldTimer);
    };

    // Gesture handling

    const pan = useRef(new Animated.ValueXY()).current;
    const totalOffset = useSharedValue<number | null>(0);

    const onGestureEvent = Animated.event(
        // Animate the slider to follow the touch
        [
            {
                nativeEvent: {
                    translationY: pan.y,
                },
            },
        ],
        {
            useNativeDriver: false,
            listener: (event: PanGestureHandlerStateChangeEvent) => {
                // Handle the gesture movement

                // Invert the value for panning up to be positive
                totalOffset.value = -event.nativeEvent.translationY;

                if (powerHoldRef.current == false) {
                    powerHoldStop();
                }
            },
        }
    );

    const onHandlerStateChange = (event: PanGestureHandlerStateChangeEvent) => {
        if (event.nativeEvent.oldState === State.UNDETERMINED && event.nativeEvent.state === State.BEGAN) {
            // Handle the start of the gesture
            powerHoldStart();
        } else if (event.nativeEvent.state == State.FAILED || event.nativeEvent.state === State.END) {
            // Handle the end of the gesture
            totalOffset.value = null;

            // Spring the animation back to the start
            Animated.spring(pan, {
                toValue: { x: 0, y: 0 },
                bounciness: 0,
                useNativeDriver: false
            }).start();

            powerHoldStop();
        }
    };


    // Helpers

    const scoreChangeHandler = (value: number) => {
        if (Math.abs(value) == 0) return;

        const a = value * (powerHold ? addendTwo : addendOne);

        if (powerHold) {
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

            <PanGestureHandler
                minDist={0}
                onGestureEvent={onGestureEvent}
                onHandlerStateChange={onHandlerStateChange}
            >
                <Animated.View
                    style={[
                        StyleSheet.absoluteFillObject,
                        {
                            transform: [
                                { translateY: pan.y },
                            ],
                        }]}
                >
                    <View style={[styles.slider, styles.sliderTop]} />
                    <View style={[styles.slider, styles.sliderBottom]} />
                </Animated.View>
            </PanGestureHandler>
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
