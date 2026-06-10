import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import * as Haptics from 'expo-haptics';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import ReAnimated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { playerRoundScoreIncrement, selectPlayerRoundStats } from '../../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../../redux/selectors';
import { logEvent } from '../../../Analytics';
import { useMenuOpen } from '../../MenuOpenContext';
import { OptimisticScoreContext } from '../../PlayerTiles/AdditionTile/OptimisticScoreContext';

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
    const { currentRoundScore, currentRoundTotalScore } = useAppSelector(
        state => selectPlayerRoundStats(state, playerId, currentRoundIndex)
    );

    const dispatch = useAppDispatch();

    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);
    const svAddendOne = useSharedValue(addendOne);
    const svAddendTwo = useSharedValue(addendTwo);
    const svRoundScore = useSharedValue(currentRoundScore);
    const svRoundTotalScore = useSharedValue(currentRoundTotalScore);
    const optimisticScores = useMemo(() => ({
        currentRoundScore: svRoundScore,
        currentRoundTotalScore: svRoundTotalScore,
    }), [svRoundScore, svRoundTotalScore]);

    useEffect(() => {
        svAddendOne.value = addendOne;
        svAddendTwo.value = addendTwo;
    }, [addendOne, addendTwo]);

    useLayoutEffect(() => {
        svRoundScore.value = currentRoundScore;
        svRoundTotalScore.value = currentRoundTotalScore;
    }, [currentRoundScore, currentRoundTotalScore]);

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
    const animationRef = useRef<Animated.CompositeAnimation>(
    );

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

    const panY = useSharedValue(0);
    const svStartRoundScore = useSharedValue(0);
    const svStartRoundTotalScore = useSharedValue(0);
    const svPendingDelta = useSharedValue(0);
    const svLastNotches = useSharedValue(0);
    const svDidFlush = useSharedValue(true);

    const { menuOpen } = useMenuOpen();

    const endGesture = useCallback((translationY: number) => {
        if (menuOpen) return;
        logEvent('score_change', {
            player_index: index,
            game_id: currentGameId,
            addend: secondaryHold ? addendTwo : addendOne,
            round: currentRoundIndex,
            type: translationY > 0 ? 'decrement' : 'increment',
            power_hold: secondaryHold,
            notches: -Math.round((translationY || 0) / notchSize),
            interaction: 'swipe-vertical',
        });
        secondaryHoldStop();
    }, [index, currentGameId, secondaryHold, addendOne, addendTwo, currentRoundIndex, menuOpen]);

    const flushPendingChange = useCallback((delta: number) => {
        if (delta === 0) return;
        if (menuOpen) return;

        dispatch(playerRoundScoreIncrement(playerId, currentRoundIndex, delta));
    }, [dispatch, playerId, currentRoundIndex, menuOpen]);

    const bumpFeedback = useCallback((secondary: boolean) => {
        if (secondary) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, []);

    const panGesture = Gesture.Pan()
        .enabled(!currentGameLocked && !menuOpen)
        .minDistance(0)
        .onBegin(() => {
            svStartRoundScore.value = svRoundScore.value;
            svStartRoundTotalScore.value = svRoundTotalScore.value;
            svPendingDelta.value = 0;
            svLastNotches.value = 0;
            svDidFlush.value = false;
            runOnJS(secondaryHoldStart)();
        })
        .onUpdate((event) => {
            const y = event.translationY;
            panY.value = y;

            if (isSecondaryHoldActive.value == false && Math.abs(y) > 1) {
                runOnJS(secondaryHoldStop)();
            }

            const notches = Math.round((-y || 0) / notchSize);
            if (notches === svLastNotches.value) return;

            svLastNotches.value = notches;
            const secondaryActive = isSecondaryHoldActive.value;
            const scoreDelta = notches * (secondaryActive ? svAddendTwo.value : svAddendOne.value);
            svPendingDelta.value = scoreDelta;
            svRoundScore.value = svStartRoundScore.value + scoreDelta;
            svRoundTotalScore.value = svStartRoundTotalScore.value + scoreDelta;
            runOnJS(bumpFeedback)(secondaryActive);
        })
        .onEnd((event) => {
            if (!svDidFlush.value) {
                svDidFlush.value = true;
                if (svPendingDelta.value !== 0) {
                    runOnJS(flushPendingChange)(svPendingDelta.value);
                }
            }
            panY.value = withTiming(0, { duration: 200 });
            runOnJS(endGesture)(event.translationY);
        })
        .onFinalize(() => {
            if (!svDidFlush.value) {
                svDidFlush.value = true;
                if (svPendingDelta.value !== 0) {
                    runOnJS(flushPendingChange)(svPendingDelta.value);
                }
            }
            runOnJS(secondaryHoldStop)();
        });

    const overlayAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: panY.value }],
    }));

    //#endregion

    return (
        <OptimisticScoreContext.Provider value={optimisticScores}>
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
        </OptimisticScoreContext.Provider>
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
