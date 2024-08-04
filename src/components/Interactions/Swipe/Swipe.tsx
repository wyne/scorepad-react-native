import React, { useEffect, useRef, useState } from 'react';

import * as Haptics from 'expo-haptics';
import { Animated, StyleSheet, View } from 'react-native';
import { PanGestureHandler, PanGestureHandlerStateChangeEvent, State } from 'react-native-gesture-handler';
import { runOnJS, useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { playerRoundScoreIncrement } from '../../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../../redux/selectors';
import { logEvent } from '../../../Analytics';

interface HalfTapProps {
    children: React.ReactNode;
    fontColor: string;
    index: number;
    playerId: string;
}

const notchSize = 50;

const SwipeVertical: React.FC<HalfTapProps> = ({
    children,
    index,
    playerId,
}) => {
    //#region Selector setup

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const roundCurrent = useAppSelector(state => selectCurrentGame(state)?.roundCurrent) || 0;
    const currentGameLocked = useAppSelector(state => selectCurrentGame(state)?.locked);

    const dispatch = useAppDispatch();

    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);

    //#endregion

    //#region Power Hold

    const powerHoldTime = 500;
    const holdDuration = useRef(new Animated.Value(0)).current;
    let powerHoldTimer: ReturnType<typeof setTimeout>;
    const [powerHold, setPowerHold] = useState<boolean>(false);
    const powerHoldRef = useRef(powerHold);
    useEffect(() => {
        powerHoldRef.current = powerHold;
    }, [powerHold]);

    useEffect(() => {
        return () => {
            clearTimeout(powerHoldTimer);
        };
    }, []);

    const scale = holdDuration.interpolate({
        inputRange: [0, powerHoldTime * .2, powerHoldTime * .9, powerHoldTime],
        outputRange: [1, 1, 1.1, 1.05],
        extrapolate: 'clamp',
    });

    const wiggleValue = useRef(new Animated.Value(0)).current;
    const animationRef = useRef<Animated.CompositeAnimation>(
    );

    const powerHoldStart = () => {
        Animated.timing(holdDuration, {
            toValue: powerHoldTime,
            duration: powerHoldTime,
            useNativeDriver: true,
        }).start();

        powerHoldTimer = setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setPowerHold(true);

            animationRef.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(wiggleValue, {
                        toValue: -1,
                        duration: 50,
                        useNativeDriver: true,
                    }),
                    Animated.timing(wiggleValue, {
                        toValue: 1,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                    Animated.timing(wiggleValue, {
                        toValue: 0,
                        duration: 50,
                        useNativeDriver: true,
                    }),
                ])
            );
            animationRef.current.start();
        }, powerHoldTime * .8);
    };

    const powerHoldStop = () => {
        Animated.timing(holdDuration, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
        }).start();

        setPowerHold(false);

        animationRef.current?.stop();

        // Reset the wiggle value
        Animated.timing(wiggleValue, {
            toValue: 0,
            duration: 0, // Change this to control the speed of the reset
            useNativeDriver: true,
        }).start();

        clearTimeout(powerHoldTimer);
    };

    //#endregion

    //#region Gesture handling

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
            useNativeDriver: true,
            listener: (event: PanGestureHandlerStateChangeEvent) => {
                // Handle the gesture movement

                // Invert the value for panning up to be positive
                const y = event.nativeEvent.translationY;
                totalOffset.value = -y;

                if (powerHoldRef.current == false && Math.abs(y) > 1) {
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

            logEvent('score_change', {
                player_index: index,
                game_id: currentGameId,
                addend: powerHold ? addendOne : addendTwo,
                round: roundCurrent,
                type: event.nativeEvent.translationY > 0 ? 'decrement' : 'increment',
                power_hold: powerHold,
                notches: -Math.round((event.nativeEvent.translationY || 0) / notchSize),
                interaction: 'swipe-vertical',
            });

            // Spring the animation back to the start
            Animated.spring(pan, {
                toValue: { x: 0, y: 0 },
                bounciness: 0,
                useNativeDriver: true
            }).start();

            powerHoldStop();
        }
    };

    //#endregion

    //#region Helpers

    const scoreChangeHandler = (value: number) => {
        if (Math.abs(value) == 0) return;

        const a = value * (powerHold ? addendTwo : addendOne);

        if (powerHold) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        dispatch(playerRoundScoreIncrement(playerId, roundCurrent, a));
    };

    useAnimatedReaction(
        () => {
            return totalOffset.value;
        },
        (currentValue, previousValue) => {
            if (currentValue === null) return;

            const c = Math.round((currentValue || 0) / notchSize);
            const p = Math.round((previousValue || 0) / notchSize);
            if (c - p !== 0) {
                runOnJS(scoreChangeHandler)(c - p);
            }
        }
    );

    //#endregion

    return (
        <>
            <Animated.View style={[
                {
                    transform: [{
                        scale: scale,
                    },
                    {
                        rotate: wiggleValue.interpolate({
                            inputRange: [-1, 1],
                            outputRange: ['-1deg', '1deg'],
                        }),
                    }],
                },
            ]}>
                {children}
            </Animated.View>

            <PanGestureHandler
                enabled={!currentGameLocked}
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

export default SwipeVertical;

const styles = StyleSheet.create({
    slider: {
        position: 'absolute',
        left: 0,
        width: '100%',
        height: 1000,
    },
    sliderTop: {
        top: -1000,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    sliderBottom: {
        top: '100%',
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
});
