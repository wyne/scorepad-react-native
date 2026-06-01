import React, { useCallback, useEffect, useRef, useState } from 'react';

import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withTiming,
} from 'react-native-reanimated';

import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { playerRoundScoreSet, selectPlayerById } from '../../../../redux/PlayersSlice';
import { selectCurrentGame } from '../../../../redux/selectors';
import DialControl from './DialControl';

const EXPAND_DURATION = 380;
const COLLAPSE_DURATION = 300;
const SWIPE_DISMISS_DISTANCE = 50;
const SWIPE_DISMISS_VELOCITY = 400;
const MARGIN_BOTTOM = 12;
const MARGIN_H = 12;

function inkFor(hex: string): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const lin = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return L > 0.42 ? '#000' : '#fff';
}

function inkA(ink: string, a: number): string {
    return ink === '#000' ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
}

interface RowRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

interface Props {
    playerId: string;
    rowRect: RowRect;
    boardWidth: number;
    boardHeight: number;
    safeAreaTop: number;
    onClose: () => void;
}

const InlineExpandOverlay: React.FC<Props> = ({
    playerId,
    rowRect,
    boardWidth,
    boardHeight,
    safeAreaTop,
    onClose,
}) => {
    const dispatch = useAppDispatch();
    const currentGame = useAppSelector(selectCurrentGame);
    const player = useAppSelector(state => selectPlayerById(state, playerId));
    const addendOne = useAppSelector(state => state.settings.addendOne);
    const addendTwo = useAppSelector(state => state.settings.addendTwo);

    const roundCurrent = currentGame?.roundCurrent ?? 0;
    const roundScore = player?.scores[roundCurrent] ?? 0;
    const prevTotal = (player?.scores ?? []).reduce(
        (sum, s, i) => i < roundCurrent ? sum + (s || 0) : sum,
        0,
    );

    const [localScore, setLocalScore] = useState(roundScore);
    const [isSecondary, setIsSecondary] = useState(false);

    // safeAreaTop is the inset reported by the OS (notch/dynamic island height).
    // The board container already starts below the navigation header, but if the
    // header is transparent or hidden (fullscreen mode) the inset is needed to
    // keep the panel below the status bar.
    const marginTop = Math.max(12, safeAreaTop);
    const targetTop = marginTop;
    const targetLeft = MARGIN_H;
    const targetWidth = boardWidth - MARGIN_H * 2;
    const targetHeight = boardHeight - marginTop - MARGIN_BOTTOM;

    const animTop = useSharedValue(rowRect.top);
    const animLeft = useSharedValue(rowRect.left);
    const animWidth = useSharedValue(rowRect.width);
    const animHeight = useSharedValue(rowRect.height);
    const contentOpacity = useSharedValue(0);
    const closing = useRef(false);

    const easing = Easing.out(Easing.cubic);

    useEffect(() => {
        animTop.value = withTiming(targetTop, { duration: EXPAND_DURATION, easing });
        animLeft.value = withTiming(targetLeft, { duration: EXPAND_DURATION, easing });
        animWidth.value = withTiming(targetWidth, { duration: EXPAND_DURATION, easing });
        animHeight.value = withTiming(targetHeight, { duration: EXPAND_DURATION, easing });
        contentOpacity.value = withDelay(160, withTiming(1, { duration: 200 }));
    }, []);

    const panelStyle = useAnimatedStyle(() => ({
        position: 'absolute',
        top: animTop.value,
        left: animLeft.value,
        width: animWidth.value,
        height: animHeight.value,
        borderRadius: 26,
        overflow: 'hidden',
    }));

    const contentStyle = useAnimatedStyle(() => ({
        flex: 1,
        opacity: contentOpacity.value,
    }));

    const handleClose = useCallback((save: boolean) => {
        if (closing.current) return;
        closing.current = true;

        if (save) {
            dispatch(playerRoundScoreSet(playerId, roundCurrent, localScore));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        contentOpacity.value = withTiming(0, { duration: 120 });
        animTop.value = withTiming(rowRect.top, { duration: COLLAPSE_DURATION, easing: Easing.in(Easing.cubic) });
        animLeft.value = withTiming(rowRect.left, { duration: COLLAPSE_DURATION, easing: Easing.in(Easing.cubic) });
        animWidth.value = withTiming(rowRect.width, { duration: COLLAPSE_DURATION, easing: Easing.in(Easing.cubic) });
        animHeight.value = withTiming(rowRect.height, {
            duration: COLLAPSE_DURATION,
            easing: Easing.in(Easing.cubic),
        }, () => runOnJS(onClose)());
    }, [localScore, onClose, playerId, roundCurrent, dispatch, rowRect]);

    const dismissOnSwipe = useCallback(() => {
        handleClose(false);
    }, [handleClose]);

    const makeSwipeDismissGesture = () =>
        Gesture.Pan()
            .onEnd((e) => {
                if (e.translationY > SWIPE_DISMISS_DISTANCE || e.velocityY > SWIPE_DISMISS_VELOCITY) {
                    runOnJS(dismissOnSwipe)();
                }
            });

    const topSwipeGesture = makeSwipeDismissGesture();
    const bottomSwipeGesture = makeSwipeDismissGesture();

    if (!player || !currentGame) return null;
    const ink = inkFor(player.color ?? '#444');
    const playerColor = player.color ?? '#444';
    const newTotal = prevTotal + localScore;

    const dialSize = Math.min(Math.round(targetHeight * 0.38), Math.round(targetWidth * 0.9), 240);
    const swipeZoneHeight = Math.round(targetHeight * 0.25);

    return (
        <>
            {/* Backdrop — tap to discard */}
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => handleClose(false)} />

            <Animated.View style={[panelStyle, { backgroundColor: playerColor }]}>
                <Animated.View style={contentStyle}>
                    <View style={styles.inner}>
                        {/* Top group: drag handle + name + prev total */}
                        <View style={styles.topGroup}>
                            <View style={[styles.dragHandle, { backgroundColor: inkA(ink, 0.3) }]} />
                            <Text
                                style={[styles.name, { color: ink }]}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.7}
                            >
                                {player.playerName}
                            </Text>
                            <View style={styles.prevBlock}>
                                <Text style={[styles.prevNumber, { color: ink }]}>{prevTotal}</Text>
                                <Text style={[styles.prevLabel, { color: inkA(ink, 0.6) }]}>PREVIOUS TOTAL</Text>
                            </View>
                        </View>

                        {/* Dial */}
                        <View style={styles.dialWrap}>
                            <DialControl
                                value={localScore}
                                onChange={setLocalScore}
                                onToggleMode={setIsSecondary}
                                isSecondary={isSecondary}
                                ink={ink}
                                newTotal={newTotal}
                                addendOne={addendOne}
                                addendTwo={addendTwo}
                                dialSize={dialSize}
                            />
                        </View>

                        {/* Done */}
                        <Pressable
                            onPress={() => handleClose(true)}
                            style={({ pressed }) => [
                                styles.doneBtn,
                                { backgroundColor: inkA(ink, pressed ? 0.28 : 0.16) },
                            ]}
                        >
                            <Text style={[styles.doneBtnText, { color: ink }]}>Done</Text>
                        </Pressable>
                    </View>

                    {/* Top swipe-to-dismiss zone (covers drag handle + name + prev total area) */}
                    <GestureDetector gesture={topSwipeGesture}>
                        <View
                            style={[styles.swipeZone, { top: 0, height: swipeZoneHeight }]}
                            pointerEvents="box-only"
                        />
                    </GestureDetector>

                    {/* Bottom swipe-to-dismiss zone (covers done button area) */}
                    <GestureDetector gesture={bottomSwipeGesture}>
                        <View
                            style={[styles.swipeZone, { bottom: 0, height: swipeZoneHeight }]}
                            pointerEvents="box-none"
                        />
                    </GestureDetector>
                </Animated.View>
            </Animated.View>
        </>
    );
};

const styles = StyleSheet.create({
    inner: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 16,
        paddingHorizontal: 24,
        paddingTop: 14,
        paddingBottom: 16,
    },
    topGroup: {
        alignItems: 'center',
        gap: 8,
        width: '100%',
    },
    dragHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
    },
    name: {
        fontSize: 32,
        fontWeight: '800',
        lineHeight: 36,
    },
    prevBlock: {
        alignItems: 'center',
        gap: 2,
    },
    prevNumber: {
        fontSize: 22,
        fontWeight: '800',
        lineHeight: 26,
        fontVariant: ['tabular-nums'],
    },
    prevLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.4,
    },
    dialWrap: {
        alignItems: 'center',
    },
    doneBtn: {
        width: '74%',
        maxWidth: 300,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 'auto',
    },
    doneBtnText: {
        fontSize: 20,
        fontWeight: '700',
    },
    swipeZone: {
        position: 'absolute',
        left: 0,
        right: 0,
    },
});

export default InlineExpandOverlay;
