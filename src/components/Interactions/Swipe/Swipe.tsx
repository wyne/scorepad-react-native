import React, { useCallback, useEffect, useRef, useState } from 'react';

import * as Haptics from 'expo-haptics';
import { Animated, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReAnimated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { selectGameById } from '../../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector, useAppStore } from '../../../../redux/hooks';
import { playerRoundScoreIncrement } from '../../../../redux/PlayersSlice';
import { setLastUsedInteractionType } from '../../../../redux/SettingsSlice';
import { logEvent } from '../../../Analytics';
import { useGestureNudge } from '../../GestureNudgeContext';
import { useLockedHint } from '../../LockedHintContext';
import { useMenuOpen } from '../../MenuOpenContext';
import { InteractionType } from '../InteractionType';

interface HalfTapProps {
    children: React.ReactNode;
    fontColor: string;
    index: number;
    playerId: string;
    /** Test-only render probe for selector invalidation regressions. */
    onRender?: (id: string) => void;
}

const notchSize = 50;

const SwipeVertical: React.FC<HalfTapProps> = ({
    children,
    index,
    playerId,
    onRender,
}) => {
    onRender?.(playerId);

    //#region Selector setup

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const currentGameLocked = useAppSelector(state => {
        const currentGameId = state.settings.currentGameId;
        return currentGameId ? selectGameById(state, currentGameId)?.locked === true : false;
    });

    const dispatch = useAppDispatch();
    const store = useAppStore();

    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);

    //#endregion

    //#region Secondary Hold

    const secondaryHoldTime = 500;
    const holdDuration = useRef(new Animated.Value(0)).current;
    let secondaryHoldTimer: ReturnType<typeof setTimeout>;
    const [secondaryHold, setSecondaryHold] = useState<boolean>(false);
    const isSecondaryHoldActive = useSharedValue(false);

    useEffect(() => {
        return () => {
            clearTimeout(secondaryHoldTimer);
        };
    }, []);

    const scale = holdDuration.interpolate({
        inputRange: [0, secondaryHoldTime * .2, secondaryHoldTime * .9, secondaryHoldTime],
        outputRange: [1, 1, 1.1, 1.05],
        extrapolate: 'clamp',
    });

    const wiggleValue = useRef(new Animated.Value(0)).current;
    const animationRef = useRef<Animated.CompositeAnimation | undefined>(undefined);

    const secondaryHoldStart = () => {
        Animated.timing(holdDuration, {
            toValue: secondaryHoldTime,
            duration: secondaryHoldTime,
            useNativeDriver: true,
        }).start();

        secondaryHoldTimer = setTimeout(() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            setSecondaryHold(true);
            isSecondaryHoldActive.value = true;

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
        }, secondaryHoldTime * .8);
    };

    const secondaryHoldStop = () => {
        Animated.timing(holdDuration, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
        }).start();

        setSecondaryHold(false);
        isSecondaryHoldActive.value = false;

        animationRef.current?.stop();

        // Reset the wiggle value
        Animated.timing(wiggleValue, {
            toValue: 0,
            duration: 0, // Change this to control the speed of the reset
            useNativeDriver: true,
        }).start();

        clearTimeout(secondaryHoldTimer);
    };

    //#endregion

    //#region Gesture handling

    const totalOffset = useSharedValue<number | null>(0);
    const panY = useSharedValue(0);

    const { menuOpen } = useMenuOpen();
    const { showLockedHint } = useLockedHint();
    const { reportMiss, reportSuccess } = useGestureNudge();
    // Whether the current drag has changed the score yet. A drag that ends
    // without scoring (usually a tap) counts as a miss for the nudge toast.
    const scoredThisGesture = useRef(false);

    const getCurrentRoundIndex = useCallback(() => {
        const state = store.getState();
        const currentGameId = state.settings.currentGameId;
        return currentGameId ? selectGameById(state, currentGameId)?.roundCurrent ?? 0 : 0;
    }, [store]);

    const beginGesture = useCallback(() => {
        scoredThisGesture.current = false;
    }, []);

    const endGesture = useCallback((translationY: number) => {
        if (menuOpen) return;
        logEvent('score_change', {
            player_index: index,
            game_id: currentGameId,
            addend: secondaryHold ? addendTwo : addendOne,
            round: getCurrentRoundIndex(),
            type: translationY > 0 ? 'decrement' : 'increment',
            power_hold: secondaryHold,
            notches: -Math.round((translationY || 0) / notchSize),
            interaction: 'swipe-vertical',
        });
        secondaryHoldStop();
    }, [index, currentGameId, secondaryHold, addendOne, addendTwo, getCurrentRoundIndex, menuOpen]);

    // Runs for every touch, including a still tap that never activates the pan
    // (onEnd only fires after activation), so a tap in swipe mode is a miss.
    const finishGesture = useCallback(() => {
        if (menuOpen) return;
        if (scoredThisGesture.current) reportSuccess();
        else if (!secondaryHold) reportMiss(InteractionType.SwipeVertical);
    }, [menuOpen, secondaryHold, reportMiss, reportSuccess]);

    const panGesture = Gesture.Pan()
        .enabled(!currentGameLocked && !menuOpen)
        .minDistance(0)
        .onBegin(() => {
            runOnJS(beginGesture)();
            runOnJS(secondaryHoldStart)();
        })
        .onUpdate((event) => {
            const y = event.translationY;
            panY.value = y;
            totalOffset.value = -y;

            if (isSecondaryHoldActive.value == false && Math.abs(y) > 1) {
                runOnJS(secondaryHoldStop)();
            }
        })
        .onEnd((event) => {
            totalOffset.value = null;
            panY.value = withTiming(0, { duration: 200 });
            runOnJS(endGesture)(event.translationY);
        })
        .onFinalize(() => {
            runOnJS(finishGesture)();
            runOnJS(secondaryHoldStop)();
        });

    // The pan is off in a locked game; a tap there explains why.
    const lockedTapGesture = Gesture.Tap()
        .enabled(currentGameLocked && !menuOpen)
        .onEnd(() => {
            runOnJS(showLockedHint)();
        });

    const overlayAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: panY.value }],
    }));

    //#endregion

    //#region Helpers

    const scoreChangeHandler = (value: number) => {
        if (Math.abs(value) == 0) return;
        if (menuOpen) return;

        const scoreDelta = value * (secondaryHold ? addendTwo : addendOne);
        const currentRoundIndex = getCurrentRoundIndex();

        if (secondaryHold) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        scoredThisGesture.current = true;
        dispatch(playerRoundScoreIncrement(playerId, currentRoundIndex, scoreDelta));
        dispatch(setLastUsedInteractionType(InteractionType.SwipeVertical));
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

            <GestureDetector gesture={Gesture.Race(panGesture, lockedTapGesture)}>
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
});
