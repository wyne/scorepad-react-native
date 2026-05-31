import React, { useCallback, useEffect, useRef, useState } from 'react';

import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, G, Line } from 'react-native-svg';

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
}) => {
    const C = D / 2;
    const R = D * 0.378;
    const SW = D * 0.077;
    const circ = 2 * Math.PI * R;

    // Visual angle tracks the finger; value updates per detent
    const [handleAngleDeg, setHandleAngleDeg] = useState(0);
    const [pulseKey, setPulseKey] = useState(0);

    // Shared values for worklet access
    const svStartValue = useSharedValue(value);
    const svInc = useSharedValue(addendOne);
    const svAccDeg = useSharedValue(0);
    const svLastAngle = useSharedValue(0);
    const svStartX = useSharedValue(0);
    const svStartY = useSharedValue(0);
    const svHasMoved = useSharedValue(false);

    useEffect(() => { svInc.value = isSecondary ? addendTwo : addendOne; }, [isSecondary, addendOne, addendTwo]);

    const lpTimer = useRef<ReturnType<typeof setTimeout>>();

    const pillScale = useSharedValue(1);
    const pillOpacity = useSharedValue(1);

    useEffect(() => {
        if (isSecondary) {
            pillScale.value = withRepeat(
                withSequence(
                    withTiming(0.88, { duration: 800, easing: Easing.inOut(Easing.sin) }),
                    withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
                ),
                -1, true,
            );
            pillOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.55, { duration: 800, easing: Easing.inOut(Easing.sin) }),
                    withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) }),
                ),
                -1, true,
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

    const startLongPress = useCallback(() => {
        lpTimer.current = setTimeout(() => {
            if (!svHasMoved.value) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                onToggleMode(true);
                svStartValue.value = value;
                svAccDeg.value = 0;
            }
        }, 420);
    }, [onToggleMode, value]);

    const stopLongPress = useCallback(() => {
        clearTimeout(lpTimer.current);
    }, []);

    const handleBump = useCallback((newVal: number) => {
        if (newVal !== value) {
            onChange(newVal);
            setPulseKey(k => k + 1);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    }, [onChange, value]);

    const handleDeactivate = useCallback(() => {
        onToggleMode(false);
    }, [onToggleMode]);

    const handleAngleUpdate = useCallback((deg: number) => {
        setHandleAngleDeg(deg);
    }, []);

    const panGesture = Gesture.Pan()
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

            let delta = angle - svLastAngle.value;
            if (delta > 180) delta -= 360;
            if (delta < -180) delta += 360;

            svAccDeg.value += delta;
            svLastAngle.value = angle;
            runOnJS(handleAngleUpdate)(angle);

            const steps = Math.round(svAccDeg.value / STEP_DEG);
            const newVal = svStartValue.value + steps * svInc.value;
            runOnJS(handleBump)(newVal);
        })
        .onEnd(() => {
            runOnJS(stopLongPress)();
            runOnJS(handleDeactivate)();
        })
        .onFinalize(() => {
            runOnJS(stopLongPress)();
            runOnJS(handleDeactivate)();
        });

    function nudge(d: number) {
        const newVal = value + d * addendOne;
        onChange(newVal);
        setPulseKey(k => k + 1);
        setHandleAngleDeg(a => a + d * STEP_DEG);
    }

    // SVG geometry from current handle angle
    const rad = handleAngleDeg * Math.PI / 180;
    const hx = C + R * Math.sin(rad);
    const hy = C - R * Math.cos(rad);
    const frac = (((handleAngleDeg % 360) + 360) % 360) / 360;
    const dashArray = `${frac * circ} ${circ}`;

    const ticks = Array.from({ length: 12 }, (_, i) => {
        const t = (i * 30) * Math.PI / 180;
        const r1 = R - SW / 2 - D * 0.021;
        const r2 = R - SW / 2 - D * 0.046;
        return {
            x1: C + r1 * Math.sin(t), y1: C - r1 * Math.cos(t),
            x2: C + r2 * Math.sin(t), y2: C - r2 * Math.cos(t),
        };
    });

    const trackColor = inkA(ink, 0.16);
    const arcColor = isSecondary ? ACCENT : ink;
    const handleStrokeColor = isSecondary ? ACCENT : 'transparent';
    const handleR = isSecondary ? D * 0.08 : D * 0.066;
    const pipR = isSecondary ? D * 0.031 : D * 0.024;
    const pipColor = ink === '#000' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)';

    return (
        <View style={styles.container}>
            {/* Step-mode pill */}
            <Animated.View style={[
                styles.pill,
                { backgroundColor: isSecondary ? ACCENT : inkA(ink, 0.12) },
                pillStyle,
            ]}>
                <View style={[styles.pillDot, { backgroundColor: isSecondary ? '#fff' : inkA(ink, 0.4) }]} />
                <Text style={[styles.pillText, { color: isSecondary ? '#fff' : ink }]}>
                    STEP ×{isSecondary ? addendTwo : addendOne}
                </Text>
            </Animated.View>

            {/* Dial */}
            <GestureDetector gesture={panGesture}>
                <View style={{ width: D, height: D, position: 'relative' }}>
                    <Svg width={D} height={D} viewBox={`0 0 ${D} ${D}`} style={StyleSheet.absoluteFill}>
                        {/* Track */}
                        <Circle cx={C} cy={C} r={R} fill="none" stroke={trackColor} strokeWidth={SW} />
                        {/* Ticks */}
                        {ticks.map((t, i) => (
                            <Line
                                key={i}
                                x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                                stroke={inkA(ink, 0.28)} strokeWidth={2.5} strokeLinecap="round"
                            />
                        ))}
                        {/* Progress arc */}
                        <Circle
                            cx={C} cy={C} r={R} fill="none"
                            stroke={arcColor} strokeWidth={SW}
                            strokeLinecap="round"
                            strokeDasharray={dashArray}
                            transform={`rotate(-90, ${C}, ${C})`}
                        />
                        {/* Handle */}
                        <G>
                            <Circle cx={hx} cy={hy} r={handleR} fill={ink}
                                stroke={handleStrokeColor} strokeWidth={isSecondary ? 4 : 0} />
                            <Circle cx={hx} cy={hy} r={pipR} fill={pipColor} />
                        </G>
                    </Svg>

                    {/* Centre value */}
                    <View style={StyleSheet.absoluteFill} pointerEvents="none">
                        <View style={styles.centerValue}>
                            <Text key={pulseKey} style={[styles.centerNumber, { color: ink, fontSize: D * 0.28 }]}>
                                {fmtSigned(value)}
                            </Text>
                            <Text style={[styles.centerLabel, { color: inkA(ink, 0.62), fontSize: D * 0.049 }]}>
                                THIS ROUND
                            </Text>
                        </View>
                    </View>
                </View>
            </GestureDetector>

            {/* Fine-tune row */}
            <View style={styles.fineTuneRow}>
                <Pressable
                    onPress={() => nudge(-1)}
                    style={({ pressed }) => [
                        styles.stepBtn,
                        {
                            backgroundColor: inkA(ink, pressed ? 0.26 : 0.15),
                            width: D * 0.265,
                            height: D * 0.224,
                        },
                    ]}
                >
                    <Text style={[styles.stepBtnText, { color: ink, fontSize: D * 0.12 }]}>
                        −{addendOne}
                    </Text>
                </Pressable>

                <View style={styles.newTotalCol}>
                    <Text style={[styles.newTotalNumber, { color: ink, fontSize: D * 0.18 }]}>
                        {newTotal}
                    </Text>
                    <Text style={[styles.newTotalLabel, { color: inkA(ink, 0.62), fontSize: D * 0.044 }]}>
                        NEW TOTAL
                    </Text>
                </View>

                <Pressable
                    onPress={() => nudge(1)}
                    style={({ pressed }) => [
                        styles.stepBtn,
                        {
                            backgroundColor: inkA(ink, pressed ? 0.26 : 0.15),
                            width: D * 0.265,
                            height: D * 0.224,
                        },
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
        gap: 14,
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
        width: '100%',
    },
    stepBtn: {
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepBtnText: {
        fontWeight: '700',
    },
    newTotalCol: {
        alignItems: 'center',
        minWidth: 80,
    },
    newTotalNumber: {
        fontWeight: '800',
    },
    newTotalLabel: {
        fontWeight: '800',
        letterSpacing: 1.5,
        marginTop: 4,
    },
});

export default DialControl;
