import React, { useCallback, useEffect, useRef, useState } from 'react';

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

import { POWER_HOLD_ACTIVATION_MS, POWER_HOLD_INDICATOR_DELAY_MS } from '../interactionConstants';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const STEP_DEG = 30;
const ACCENT = '#3a86ff';
const MOVE_THRESHOLD_SQ = 100;

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
    value: number;
    onChange: (v: number) => void;
    onToggleMode: (active: boolean) => void;
    isSecondary: boolean;
    ink: string;
    newTotal: number;
    addendOne: number;
    addendTwo: number;
    dialSize: number;
    landscape?: boolean;
    menuOpen?: boolean;
}

const DialControl: React.FC<Props> = ({
    value,
    onChange,
    onToggleMode,
    isSecondary,
    ink,
    newTotal,
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

    // Visual state (React state — drives SVG re-renders)
    const [handleAngleDeg, setHandleAngleDeg] = useState(0);
    const [trailStartDeg, setTrailStartDeg] = useState(0);
    const [accDegrees, setAccDegrees] = useState(0);   // accumulated rotation since drag start
    const [isDragging, setIsDragging] = useState(false);

    const numScale = useSharedValue(1);
    const numScaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: numScale.value }],
    }));

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

    // Shared values for worklet access
    const svInc = useSharedValue(addendOne);
    const svAccDeg = useSharedValue(0);
    const svLastAngle = useSharedValue(0);
    const svStartX = useSharedValue(0);
    const svStartY = useSharedValue(0);
    const svHasMoved = useSharedValue(false);
    const svStartValue = useSharedValue(value);

    useEffect(() => { svInc.value = isSecondary ? addendTwo : addendOne; }, [isSecondary, addendOne, addendTwo]);

    const lpTimer = useRef<ReturnType<typeof setTimeout>>();
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
            POWER_HOLD_INDICATOR_DELAY_MS,
            withTiming(1, {
                duration: POWER_HOLD_ACTIVATION_MS - POWER_HOLD_INDICATOR_DELAY_MS,
                easing: Easing.out(Easing.quad),
            }),
        );
        lpTimer.current = setTimeout(() => {
            if (!svHasMoved.value) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                onToggleMode(true);
                svAccDeg.value = 0;
                // Snap ring back on activation
                holdProgress.value = withTiming(0, { duration: 120, easing: Easing.out(Easing.cubic) });
            }
        }, POWER_HOLD_ACTIVATION_MS);
    }, [onToggleMode, value]);

    const stopLongPress = useCallback(() => {
        clearTimeout(lpTimer.current);
        holdProgress.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
    }, []);

    const handleBump = useCallback((newVal: number) => {
        if (newVal !== value) {
            onChange(newVal);
            if (isSecondaryRef.current) popNumber();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [onChange, value, popNumber]);

    const handleDeactivate = useCallback(() => {
        onToggleMode(false);
    }, [onToggleMode]);

    const handleAngleUpdate = useCallback((deg: number) => {
        setHandleAngleDeg(deg);
    }, []);

    const handleAccUpdate = useCallback((acc: number) => {
        setAccDegrees(acc);
    }, []);

    const handleDragStart = useCallback((startDeg: number) => {
        setTrailStartDeg(startDeg);
        setIsDragging(true);
        setAccDegrees(0);
    }, []);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        setAccDegrees(0);
    }, []);

    const panGesture = Gesture.Pan()
        .enabled(!menuOpen)
        .minDistance(0)
        .onBegin((e) => {
            svStartValue.value = value;
            svAccDeg.value = 0;
            svHasMoved.value = false;
            svStartX.value = e.x;
            svStartY.value = e.y;

            const dx = e.x - C;
            const dy = e.y - C;
            const angle = Math.atan2(dx, -dy) * 180 / Math.PI;
            svLastAngle.value = angle;

            runOnJS(handleDragStart)(angle);
            runOnJS(handleAngleUpdate)(angle);
            runOnJS(startLongPress)();
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

            runOnJS(handleAngleUpdate)(angle);
            runOnJS(handleAccUpdate)(svAccDeg.value);

            const steps = Math.round(svAccDeg.value / STEP_DEG);
            const newVal = svStartValue.value + steps * svInc.value;
            runOnJS(handleBump)(newVal);
        })
        .onEnd(() => {
            runOnJS(stopLongPress)();
            runOnJS(handleDeactivate)();
            runOnJS(handleDragEnd)();
        })
        .onFinalize(() => {
            runOnJS(stopLongPress)();
            runOnJS(handleDeactivate)();
            runOnJS(handleDragEnd)();
        });

    // --- SVG geometry ---
    const ringColor = isSecondary ? ACCENT : ink;
    const trackColor = inkA(ink, 0.18);

    // Notch indicator: short radial line at handleAngleDeg on the ring
    const notchRad = handleAngleDeg * Math.PI / 180;
    const notchInner = R - SW / 2 + 6;
    const notchOuter = R + SW / 2 - 6;
    const notchX1 = C + notchInner * Math.sin(notchRad);
    const notchY1 = C - notchInner * Math.cos(notchRad);
    const notchX2 = C + notchOuter * Math.sin(notchRad);
    const notchY2 = C - notchOuter * Math.cos(notchRad);

    // Tick marks on the ring
    const ticks = Array.from({ length: 12 }, (_, i) => {
        const t = (i * 30) * Math.PI / 180;
        const tickInner = R - SW * 0.18;
        const tickOuter = R + SW * 0.18;
        return {
            x1: C + tickInner * Math.sin(t), y1: C - tickInner * Math.cos(t),
            x2: C + tickOuter * Math.sin(t), y2: C - tickOuter * Math.cos(t),
        };
    });

    // Trail arc — use explicit SVG Path so there's no seam/reset artifact at 0°.
    // strokeDasharray on a circle resets at the path's join point (top after
    // our rotate(-90) transform); a Path arc avoids that entirely.
    const absAcc = Math.abs(accDegrees);
    const isFullCircle = isDragging && absAcc >= 360;

    let trailPathD = '';
    if (isDragging && absAcc > 1 && !isFullCircle) {
        const isCW = accDegrees >= 0;
        // Cap just under 360 so the arc command stays valid (360° = degenerate)
        const sweepDeg = Math.min(absAcc, 359.9);
        const endDeg = isCW ? trailStartDeg + sweepDeg : trailStartDeg - sweepDeg;
        const toRad = (d: number) => d * Math.PI / 180;
        const sx = C + R * Math.sin(toRad(trailStartDeg));
        const sy = C - R * Math.cos(toRad(trailStartDeg));
        const ex = C + R * Math.sin(toRad(endDeg));
        const ey = C - R * Math.cos(toRad(endDeg));
        const largeArc = sweepDeg > 180 ? 1 : 0;
        const sweep = isCW ? 1 : 0;
        trailPathD = `M ${sx} ${sy} A ${R} ${R} 0 ${largeArc} ${sweep} ${ex} ${ey}`;
    }

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

                        {/* Full-circle trail when rotation ≥ 360° — solid/bold */}
                        {isFullCircle && (
                            <Circle cx={C} cy={C} r={R} fill="none"
                                stroke={pipColor} strokeWidth={SW * 0.55}
                                strokeOpacity={0.9}
                            />
                        )}

                        {/* Partial trail arc — lighter while building up to a full circle */}
                        {trailPathD !== '' && (
                            <Path
                                d={trailPathD}
                                fill="none"
                                stroke={pipColor} strokeWidth={SW * 0.55}
                                strokeOpacity={0.45}
                                strokeLinecap="round"
                            />
                        )}

                        {/* Notch indicator — only visible while dragging */}
                        {isDragging && (
                            <Line
                                x1={notchX1} y1={notchY1} x2={notchX2} y2={notchY2}
                                stroke={pipColor} strokeWidth={3.5} strokeLinecap="round"
                            />
                        )}
                    </Svg>

                    {/* Centre value */}
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        <View style={styles.centerValue}>
                            <Animated.View style={[numScaleStyle, { width: D * 0.54 }]}>
                                <Text
                                    style={[styles.centerNumber, { color: ink, fontSize: D * 0.20 }]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.4}
                                >
                                    {fmtSigned(value)}
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
                    onPress={() => {
                        onChange(value - addendOne);
                        setHandleAngleDeg(a => a - STEP_DEG);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
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
                    <View style={styles.newTotalCol}>
                        <Text style={[styles.newTotalNumber, { color: ink, fontSize: D * 0.18 }]}>
                            {newTotal}
                        </Text>
                        <Text style={[styles.newTotalLabel, { color: inkA(ink, 0.62), fontSize: D * 0.044 }]}>
                            NEW TOTAL
                        </Text>
                    </View>
                )}

                <Pressable
                    testID="btn-increment"
                    disabled={menuOpen}
                    onPress={() => {
                        onChange(value + addendOne);
                        setHandleAngleDeg(a => a + STEP_DEG);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
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

export default DialControl;
