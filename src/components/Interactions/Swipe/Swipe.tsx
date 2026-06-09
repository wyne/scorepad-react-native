import React, { useCallback, useEffect, useRef, useState } from 'react';

import * as Haptics from 'expo-haptics';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReAnimated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { playerRoundScoreIncrement } from '../../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../../redux/selectors';
import { logEvent } from '../../../Analytics';
import { useMenuOpen } from '../../MenuOpenContext';

interface HalfTapProps {
    children: React.ReactNode;
    fontColor: string;
    index: number;
    playerId: string;
    showHint?: boolean;
    tileHeight?: number;
}

const notchSize = 50;

const HINT_MIN_HEIGHT = 200;

const SwipeVertical: React.FC<HalfTapProps> = ({
    children,
    index,
    playerId,
    fontColor,
    showHint,
    tileHeight,
}) => {
    const hintVisible = showHint && (!tileHeight || tileHeight >= HINT_MIN_HEIGHT);
    //#region Selector setup

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentRoundIndex = useAppSelector(state => selectCurrentGame(state)?.roundCurrent) || 0;
    const currentGameLocked = useAppSelector(state => selectCurrentGame(state)?.locked);

    const dispatch = useAppDispatch();

    const primaryPointStep = useAppSelector(state => state.settings.addendOne);
    const secondaryPointStep = useAppSelector(state => state.settings.addendTwo);

    //#endregion

    //#region Power Hold

    const powerHoldTime = 500;
    const holdDuration = useRef(new Animated.Value(0)).current;
    let powerHoldTimer: ReturnType<typeof setTimeout>;
    const [powerHold, setPowerHold] = useState<boolean>(false);
    const isPowerHoldActive = useSharedValue(false);

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
            isPowerHoldActive.value = true;

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
        isPowerHoldActive.value = false;

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

    const totalOffset = useSharedValue<number | null>(0);
    const panY = useSharedValue(0);

    const { menuOpen } = useMenuOpen();

    const endGesture = useCallback((translationY: number) => {
        if (menuOpen) return;
        logEvent('score_change', {
            player_index: index,
            game_id: currentGameId,
            addend: powerHold ? primaryPointStep : secondaryPointStep,
            round: currentRoundIndex,
            type: translationY > 0 ? 'decrement' : 'increment',
            power_hold: powerHold,
            notches: -Math.round((translationY || 0) / notchSize),
            interaction: 'swipe-vertical',
        });
        powerHoldStop();
    }, [index, currentGameId, powerHold, primaryPointStep, secondaryPointStep, currentRoundIndex, menuOpen]);

    const panGesture = Gesture.Pan()
        .enabled(!currentGameLocked && !menuOpen)
        .minDistance(0)
        .onBegin(() => {
            runOnJS(powerHoldStart)();
        })
        .onUpdate((event) => {
            const y = event.translationY;
            panY.value = y;
            totalOffset.value = -y;

            if (isPowerHoldActive.value == false && Math.abs(y) > 1) {
                runOnJS(powerHoldStop)();
            }
        })
        .onEnd((event) => {
            totalOffset.value = null;
            panY.value = withTiming(0, { duration: 200 });
            runOnJS(endGesture)(event.translationY);
        })
        .onFinalize(() => {
            runOnJS(powerHoldStop)();
        });

    const overlayAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: panY.value }],
    }));

    //#endregion

    //#region Helpers

    const scoreChangeHandler = (value: number) => {
        if (Math.abs(value) == 0) return;
        if (menuOpen) return;

        const scoreDelta = value * (powerHold ? secondaryPointStep : primaryPointStep);

        if (powerHold) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        dispatch(playerRoundScoreIncrement(playerId, currentRoundIndex, scoreDelta));
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

            {hintVisible && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    <Text style={[styles.swipeHintTop, { color: fontColor }]}>▲</Text>
                    <Text style={[styles.swipeHintBottom, { color: fontColor }]}>▼</Text>
                </View>
            )}

            <GestureDetector gesture={panGesture}>
                <ReAnimated.View
                    testID={`swipe-overlay-${index}`}
                    style={[
                        StyleSheet.absoluteFill,
                        overlayAnimatedStyle,
                    ]}
                >
                    <View style={[styles.slider, styles.sliderTop]} />
                    <View style={[styles.slider, styles.sliderBottom]} />
                </ReAnimated.View>
            </GestureDetector>
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
    swipeHintTop: {
        position: 'absolute',
        top: 6,
        alignSelf: 'center',
        fontSize: 16,
        opacity: 0.2,
    },
    swipeHintBottom: {
        position: 'absolute',
        bottom: 6,
        alignSelf: 'center',
        fontSize: 16,
        opacity: 0.2,
    },
});
