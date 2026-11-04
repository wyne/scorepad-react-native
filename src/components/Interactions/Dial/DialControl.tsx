import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { useGestureNudge } from '../../GestureNudgeContext';
import { SECONDARY_HOLD_ACTIVATION_MS, SECONDARY_HOLD_INDICATOR_DELAY_MS } from '../interactionConstants';
import { InteractionType } from '../InteractionType';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const STEP_DEG = 30;
const ACCENT = '#3a86ff';
const MOVE_THRESHOLD_SQ = 100;
const CENTER_VALUE_BASE_FONT_RATIO = 0.20;
const CENTER_VALUE_MIN_SCALE = 0.62;
const CENTER_VALUE_TARGET_CHARS = 4;

export function getCenterValueFontScale(value: number): number {
    const textLength = value > 0 ? String(value).length + 1 : String(value).length;
    return Math.max(CENTER_VALUE_MIN_SCALE, Math.min(1, CENTER_VALUE_TARGET_CHARS / textLength));
}

// TODO: see ListBoard.tsx — consolidate inkFor/inkA into shared colorUtils module
function inkA(ink: string, a: number): string {
    return ink === '#000' ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
}

function fmtSigned(v: number): string {
    if (v > 0) return '+' + v;
    return String(v);
}

// Wrap angle delta to [-180, 180]
function wrapDelta(delta: number): number {
    'worklet';
    if (delta > 180) return delta - 360;
    if (delta < -180) return delta + 360;
    return delta;
}

interface Props {
    /** The round score as saved in the store. */
    value: number;
    /** Total of all rounds before this one. */
    previousTotal: number;
    onChange: (v: number) => void;
    onToggleMode: (active: boolean) => void;
    isSecondary: boolean;
    ink: string;
    addendOne: number;
    addendTwo: number;
    dialSize: number;
    landscape?: boolean;
    menuOpen?: boolean;
}

const DialControl: React.FC<Props> = ({
    value,
    previousTotal,
    onChange,
    onToggleMode,
    isSecondary,
    ink,
    addendOne,
    addendTwo,
    dialSize: D,
    landscape = false,
    menuOpen = false,
}) => {
    const C = D / 2;
    const R = D * 0.36;    // ring centre radius
    const SW = D * 0.13;   // ring stroke width

    // Pip colour (contrasts with the ink on the ring)
    const pipColor = ink === '#000' ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)';

    // Drag visual state — SharedValues on UI thread, drives SVG via useAnimatedProps
    const svIsDragging = useSharedValue(false);
    const svTrailStartDeg = useSharedValue(0);
    // svLastAngle and svAccDeg (below) are reused for notch position and trail arc

    const numScale = useSharedValue(1);
    const numScaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: numScale.value }],
    }));

    // Score state lives on the JS thread only. The UI thread just turns finger
    // movement into notch counts, so the round score and new total are always
    // drawn from the same number and the next turn starts from the saved score.
    const [dragValue, setDragValue] = useState<number | null>(null);
    const shownValue = dragValue ?? value;
    const latestValueRef = useRef(value); // saved score, or the one just sent to the store
    useLayoutEffect(() => { latestValueRef.current = value; }, [value]);
    const dragBaseRef = useRef(value);
    const dragPendingRef = useRef(value);

    const popNumber = useCallback(() => {
        numScale.value = withSequence(
            withTiming(1.15, { duration: 55 }),
            withTiming(1, { duration: 140, easing: Easing.out(Easing.cubic) }),
        );
    }, []);

    // Cancel any in-progress dial long-press when the menu opens
    useEffect(() => {
        if (menuOpen) stopLongPress();
    }, [menuOpen]);

    const isSecondaryRef = useRef(isSecondary);
    isSecondaryRef.current = isSecondary;

    const addendsRef = useRef({ addendOne, addendTwo });
    addendsRef.current = { addendOne, addendTwo };
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;
    const onToggleModeRef = useRef(onToggleMode);
    onToggleModeRef.current = onToggleMode;

    // Shared values for worklet access
    const svAccDeg = useSharedValue(0);
    const svLastAngle = useSharedValue(0);
    const svStartX = useSharedValue(0);
    const svStartY = useSharedValue(0);
    const svHasMoved = useSharedValue(false);
    const svLastStep = useSharedValue(0);
    const svDidFlush = useSharedValue(true);

    const lpTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(lpTimer.current), []);

    // Pill pulse animation
    const pillScale = useSharedValue(1);
    const pillOpacity = useSharedValue(1);

    const pillActive = isSecondary;

    useEffect(() => {
        if (pillActive) {
            pillScale.value = withRepeat(
                withSequence(
                    withTiming(0.88, { duration: 800, easing: Easing.inOut(Easing.sin) }),
                    withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
                ), -1, true,
            );
            pillOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.55, { duration: 800, easing: Easing.inOut(Easing.sin) }),
                    withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
                ), -1, true,
            );
        } else {
            pillScale.value = withTiming(1, { duration: 150 });
            pillOpacity.value = withTiming(1, { duration: 150 });
        }
    }, [isSecondary]);

    const pillStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pillScale.value }],
        opacity: pillOpacity.value,
    }));

    // Ring grow animation during long-press build-up
    const holdProgress = useSharedValue(0);
    const ringAnimProps = useAnimatedProps(() => ({
        strokeWidth: SW * (1 + holdProgress.value * 0.35),
    }));
    const trackAnimProps = useAnimatedProps(() => ({
        strokeWidth: SW * (1 + holdProgress.value * 0.35),
    }));

    // JS-thread callbacks called via runOnJS
    const startLongPress = useCallback(() => {
        holdProgress.value = withDelay(
            SECONDARY_HOLD_INDICATOR_DELAY_MS,
            withTiming(1, {
                duration: SECONDARY_HOLD_ACTIVATION_MS - SECONDARY_HOLD_INDICATOR_DELAY_MS,
                easing: Easing.out(Easing.quad),
            }),
        );
        lpTimer.current = setTimeout(() => {
            if (!svHasMoved.value) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                isSecondaryRef.current = true;
                onToggleModeRef.current(true);
                svAccDeg.value = 0;
                // Snap ring back on activation
                holdProgress.value = withTiming(0, { duration: 120, easing: Easing.out(Easing.cubic) });
            }
        }, SECONDARY_HOLD_ACTIVATION_MS);
    }, []);

    const stopLongPress = useCallback(() => {
        clearTimeout(lpTimer.current);
        holdProgress.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
    }, []);

    const handleBumpFeedback = useCallback(() => {
        if (isSecondaryRef.current) popNumber();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [popNumber]);

    // Notch indicator — position and visibility driven by UI-thread SharedValues
    const notchAnimProps = useAnimatedProps(() => {
        const rad = svLastAngle.value * Math.PI / 180;
        const inner = R - SW / 2 + 6;
        const outer = R + SW / 2 - 6;
        return {
            x1: C + inner * Math.sin(rad),
            y1: C - inner * Math.cos(rad),
            x2: C + outer * Math.sin(rad),
            y2: C - outer * Math.cos(rad),
            strokeOpacity: svIsDragging.value ? 1 : 0,
        };
    });

    // Trail arc path — computed on UI thread from accumulated rotation
    const trailAnimProps = useAnimatedProps(() => {
        'worklet';
        const dragging = svIsDragging.value;
        const acc = svAccDeg.value;
        const absAcc = Math.abs(acc);
        if (!dragging || absAcc <= 1 || absAcc >= 360) {
            return { d: 'M 0 0', strokeOpacity: 0 };
        }
        const isCW = acc >= 0;
        const sweepDeg = Math.min(absAcc, 359.9);
        const startDeg = svTrailStartDeg.value;
        const endDeg = isCW ? startDeg + sweepDeg : startDeg - sweepDeg;
        const toRad = (d: number) => d * Math.PI / 180;
        const sx = C + R * Math.sin(toRad(startDeg));
        const sy = C - R * Math.cos(toRad(startDeg));
        const ex = C + R * Math.sin(toRad(endDeg));
        const ey = C - R * Math.cos(toRad(endDeg));
        const largeArc = sweepDeg > 180 ? 1 : 0;
        const sweep = isCW ? 1 : 0;
        return {
            d: `M ${sx} ${sy} A ${R} ${R} 0 ${largeArc} ${sweep} ${ex} ${ey}`,
            strokeOpacity: 0.45,
        };
    });

    // Full-circle indicator — visible when a complete rotation is accumulated
    const fullCircleAnimProps = useAnimatedProps(() => ({
        strokeOpacity: svIsDragging.value && Math.abs(svAccDeg.value) >= 360 ? 0.9 : 0,
    }));

    // A touch on the ring that ends without turning it (and without holding
    // for the larger step) changed nothing: tell the nudge toast.
    const { reportMiss, reportSuccess } = useGestureNudge();
    const reportMissRef = useRef(reportMiss);
    reportMissRef.current = reportMiss;
    const reportSuccessRef = useRef(reportSuccess);
    reportSuccessRef.current = reportSuccess;

    const beginDrag = useCallback(() => {
        dragBaseRef.current = latestValueRef.current;
        dragPendingRef.current = latestValueRef.current;
        startLongPress();
    }, [startLongPress]);

    const dragToStep = useCallback((steps: number) => {
        const { addendOne: one, addendTwo: two } = addendsRef.current;
        const newVal = dragBaseRef.current + steps * (isSecondaryRef.current ? two : one);
        dragPendingRef.current = newVal;
        setDragValue(newVal);
        handleBumpFeedback();
    }, [handleBumpFeedback]);

    const endDrag = useCallback((hasMoved: boolean) => {
        const pending = dragPendingRef.current;
        if (pending !== dragBaseRef.current) {
            latestValueRef.current = pending;
            onChangeRef.current(pending);
            reportSuccessRef.current();
        } else if (!hasMoved && !isSecondaryRef.current) {
            reportMissRef.current(InteractionType.Dial);
        }
        setDragValue(null);
        stopLongPress();
        isSecondaryRef.current = false;
        onToggleModeRef.current(false);
    }, [stopLongPress]);

    const panGesture = useMemo(() => Gesture.Pan()
        .enabled(!menuOpen)
        .minDistance(0)
        .onBegin((e) => {
            svLastStep.value = 0; // last emitted notch offset from the drag start
            svDidFlush.value = false; // reset one-shot guard for the end-of-drag commit
            svAccDeg.value = 0; // accumulated rotation degrees since gesture start
            svHasMoved.value = false; // long-press hold is still possible until movement passes threshold
            svStartX.value = e.x; // touch start x, used to detect movement beyond hold threshold
            svStartY.value = e.y; // touch start y, used to detect movement beyond hold threshold

            const dx = e.x - C;
            const dy = e.y - C;
            const angle = Math.atan2(dx, -dy) * 180 / Math.PI;
            svLastAngle.value = angle;
            svTrailStartDeg.value = angle;
            svIsDragging.value = true;

            runOnJS(beginDrag)();
        })
        .onUpdate((e) => {
            const dx2 = e.x - svStartX.value;
            const dy2 = e.y - svStartY.value;
            if (!svHasMoved.value && (dx2 * dx2 + dy2 * dy2) > MOVE_THRESHOLD_SQ) {
                svHasMoved.value = true;
                runOnJS(stopLongPress)();
            }

            const dx = e.x - C;
            const dy = e.y - C;
            const angle = Math.atan2(dx, -dy) * 180 / Math.PI;

            const delta = wrapDelta(angle - svLastAngle.value);
            svAccDeg.value += delta;
            svLastAngle.value = angle;

            const steps = Math.round(svAccDeg.value / STEP_DEG);
            if (steps === svLastStep.value) return;

            svLastStep.value = steps;
            runOnJS(dragToStep)(steps);
        })
        .onEnd(() => {
            // onFinalize can run after onEnd, so guard the commit.
            if (!svDidFlush.value) {
                svDidFlush.value = true;
                runOnJS(endDrag)(svHasMoved.value);
            }
            svIsDragging.value = false;
            svAccDeg.value = 0;
        })
        .onFinalize(() => {
            // onEnd can run before onFinalize, so guard the commit.
            if (!svDidFlush.value) {
                svDidFlush.value = true;
                runOnJS(endDrag)(svHasMoved.value);
            }
            svIsDragging.value = false;
            svAccDeg.value = 0;
        }), [
        menuOpen, C, beginDrag, dragToStep, endDrag, stopLongPress,
        svAccDeg, svDidFlush, svHasMoved, svIsDragging, svLastAngle, svLastStep, svStartX, svStartY, svTrailStartDeg,
    ]);

    const stepBy = useCallback((delta: number) => {
        const newVal = latestValueRef.current + delta;
        latestValueRef.current = newVal;
        onChange(newVal);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [onChange]);

    // --- SVG geometry ---
    const ringColor = isSecondary ? ACCENT : ink;
    const trackColor = inkA(ink, 0.18);

    // Tick marks — memoized, only recomputed when dial size changes
    const ticks = useMemo(() => Array.from({ length: 12 }, (_, i) => {
        const t = (i * 30) * Math.PI / 180;
        const tickInner = R - SW * 0.18;
        const tickOuter = R + SW * 0.18;
        return {
            x1: C + tickInner * Math.sin(t), y1: C - tickInner * Math.cos(t),
            x2: C + tickOuter * Math.sin(t), y2: C - tickOuter * Math.cos(t),
        };
    }), [C, R, SW]);

    return (
        <View style={styles.container}>
            {/* Step-mode pill — hidden in landscape (rendered externally in left column) */}
            {!landscape && (
                <Animated.View style={[
                    styles.pill,
                    { backgroundColor: pillActive ? ACCENT : inkA(ink, 0.12) },
                    pillStyle,
                ]}>
                    <View style={[styles.pillDot, { backgroundColor: pillActive ? '#fff' : inkA(ink, 0.4) }]} />
                    <Text style={[styles.pillText, { color: pillActive ? '#fff' : ink }]}>
                        STEP +{pillActive ? addendTwo : addendOne}
                    </Text>
                </Animated.View>
            )}

            {/* Dial */}
            <GestureDetector gesture={panGesture}>
                <View testID="dial-gesture-area" style={{ width: D, height: D, position: 'relative' }}>
                    <View testID="dial-top" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: D * 0.35 }} pointerEvents="none" />
                    <View testID="dial-bottom" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: D * 0.35 }} pointerEvents="none" />
                    <Svg width={D} height={D} viewBox={`0 0 ${D} ${D}`} style={StyleSheet.absoluteFill}>
                        {/* Base track ring — grows with holdProgress */}
                        <AnimatedCircle cx={C} cy={C} r={R} fill="none"
                            stroke={trackColor}
                            animatedProps={trackAnimProps}
                        />

                        {/* Filled ring (the "handle") — grows with holdProgress */}
                        <AnimatedCircle cx={C} cy={C} r={R} fill="none"
                            stroke={ringColor}
                            strokeOpacity={0.85}
                            animatedProps={ringAnimProps}
                        />

                        {/* Tick marks inside the ring */}
                        {ticks.map((t, i) => (
                            <Line
                                key={i}
                                x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                                stroke={pipColor} strokeWidth={2} strokeLinecap="round"
                                strokeOpacity={0.45}
                            />
                        ))}

                        {/* Full-circle trail when rotation ≥ 360° — opacity driven by worklet */}
                        <AnimatedCircle cx={C} cy={C} r={R} fill="none"
                            stroke={pipColor} strokeWidth={SW * 0.55}
                            animatedProps={fullCircleAnimProps}
                        />

                        {/* Partial trail arc — d and opacity driven by worklet */}
                        <AnimatedPath
                            animatedProps={trailAnimProps}
                            fill="none"
                            stroke={pipColor} strokeWidth={SW * 0.55}
                            strokeLinecap="round"
                        />

                        {/* Notch indicator — position and opacity driven by worklet */}
                        <AnimatedLine
                            animatedProps={notchAnimProps}
                            stroke={pipColor} strokeWidth={3.5} strokeLinecap="round"
                        />
                    </Svg>

                    {/* Centre value */}
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        <View style={styles.centerValue}>
                            <Animated.View style={[numScaleStyle, { width: D * 0.62 }]}>
                                <Text
                                    testID="dial-round-value"
                                    numberOfLines={1}
                                    style={[styles.centerNumber, {
                                        color: ink,
                                        fontSize: D * CENTER_VALUE_BASE_FONT_RATIO * getCenterValueFontScale(shownValue),
                                    }]}
                                >
                                    {fmtSigned(shownValue)}
                                </Text>
                            </Animated.View>
                            <Text style={[styles.centerLabel, { color: inkA(ink, 0.62), fontSize: D * 0.049 }]}>
                                THIS ROUND
                            </Text>
                        </View>
                    </View>
                </View>
            </GestureDetector>

            {/* Fine-tune row */}
            <View style={[styles.fineTuneRow, { width: D }]}>
                <Pressable
                    testID="btn-decrement"
                    disabled={menuOpen}
                    onPress={() => stepBy(-addendOne)}
                    style={({ pressed }) => [
                        styles.stepBtn,
                        { backgroundColor: inkA(ink, pressed ? 0.26 : 0.15), width: D * 0.265, height: D * 0.224 },
                    ]}
                >
                    <Text style={[styles.stepBtnText, { color: ink, fontSize: D * 0.12 }]}>
                        −{addendOne}
                    </Text>
                </Pressable>

                {!landscape && (
                    <View style={styles.newTotalCol} pointerEvents="none">
                        <Text
                            testID="dial-new-total"
                            numberOfLines={1}
                            style={[styles.newTotalNumber, { color: ink, fontSize: D * 0.18, textAlign: 'center' }]}
                        >
                            {previousTotal + shownValue}
                        </Text>
                        <Text style={[styles.newTotalLabel, { color: inkA(ink, 0.62), fontSize: D * 0.044 }]}>
                            NEW TOTAL
                        </Text>
                    </View>
                )}

                <Pressable
                    testID="btn-increment"
                    disabled={menuOpen}
                    onPress={() => stepBy(addendOne)}
                    style={({ pressed }) => [
                        styles.stepBtn,
                        { backgroundColor: inkA(ink, pressed ? 0.26 : 0.15), width: D * 0.265, height: D * 0.224 },
                    ]}
                >
                    <Text style={[styles.stepBtnText, { color: ink, fontSize: D * 0.12 }]}>
                        +{addendOne}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: 10,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 999,
    },
    pillDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    pillText: {
        fontWeight: '700',
        fontSize: 13,
        letterSpacing: 0.8,
    },
    centerValue: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerNumber: {
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
    },
    centerLabel: {
        fontWeight: '800',
        letterSpacing: 2,
        marginTop: 6,
    },
    fineTuneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    stepBtn: {
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepBtnText: {
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    newTotalCol: {
        alignItems: 'center',
        minWidth: 80,
    },
    newTotalNumber: {
        fontWeight: '800',
        fontVariant: ['tabular-nums'],
    },
    newTotalLabel: {
        fontWeight: '800',
        letterSpacing: 1.5,
        marginTop: 4,
    },
});

export default React.memo(DialControl);
