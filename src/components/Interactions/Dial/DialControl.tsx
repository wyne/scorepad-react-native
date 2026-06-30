import React, { useCallback, useEffect, useMemo } from 'react';

import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    Easing,
    SharedValue,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path } from 'react-native-svg';

// Extend TextInputProps to include Reanimated's animated text content prop
type AnimatedTextInputProps = TextInputProps & {
    text?: string;
};
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput as React.ComponentType<AnimatedTextInputProps>);

import { useDialGesture } from './useDialGesture';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const ACCENT = '#3a86ff';
const CENTER_VALUE_BASE_FONT_RATIO = 0.20;
const CENTER_VALUE_MIN_SCALE = 0.62;
const CENTER_VALUE_TARGET_CHARS = 4;

export function getCenterValueFontScale(value: number): number {
    'worklet';
    const textLength = value > 0 ? String(value).length + 1 : String(value).length;
    return Math.max(CENTER_VALUE_MIN_SCALE, Math.min(1, CENTER_VALUE_TARGET_CHARS / textLength));
}

// TODO: see ListBoard.tsx — consolidate inkFor/inkA into shared colorUtils module
function inkA(ink: string, a: number): string {
    return ink === '#000' ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
}

function fmtSigned(v: number): string {
    'worklet';
    if (v > 0) return '+' + v;
    return String(v);
}

interface Props {
    svValue: SharedValue<number>;
    onChange: (v: number) => void;
    onToggleMode: (active: boolean) => void;
    isSecondary: boolean;
    ink: string;
    svNewTotal: SharedValue<number>;
    addendOne: number;
    addendTwo: number;
    dialSize: number;
    landscape?: boolean;
    menuOpen?: boolean;
    showHint?: boolean;
}

const DialControl: React.FC<Props> = ({
    svValue,
    onChange,
    onToggleMode,
    isSecondary,
    ink,
    svNewTotal,
    addendOne,
    addendTwo,
    dialSize: D,
    landscape = false,
    menuOpen = false,
    showHint = false,
}) => {
    const C = D / 2;
    const R = D * 0.36;    // ring centre radius
    const SW = D * 0.13;   // ring stroke width

    // Pip colour (contrasts with the ink on the ring)
    const pipColor = ink === '#000' ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)';

    const numScale = useSharedValue(1);
    const numScaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: numScale.value }],
    }));
    const centerNumberFitStyle = useAnimatedStyle(() => ({
        fontSize: D * CENTER_VALUE_BASE_FONT_RATIO * getCenterValueFontScale(svValue.value),
    }));

    const arrowBob = useSharedValue(0);
    const arrowOpacity = useSharedValue(0.4);

    useEffect(() => {
        if (!showHint) return;
        arrowBob.value = withRepeat(
            withSequence(
                withTiming(-7, { duration: 750, easing: Easing.inOut(Easing.quad) }),
                withTiming(0, { duration: 750, easing: Easing.inOut(Easing.quad) }),
            ), -1, false,
        );
        arrowOpacity.value = withRepeat(
            withSequence(
                withTiming(0.9, { duration: 750, easing: Easing.inOut(Easing.quad) }),
                withTiming(0.4, { duration: 750, easing: Easing.inOut(Easing.quad) }),
            ), -1, false,
        );
    }, [showHint]);

    const leftArrowStyle = useAnimatedStyle(() => ({
        opacity: arrowOpacity.value,
        transform: [{ rotate: '-145deg' }, { translateY: arrowBob.value }],
    }));
    const rightArrowStyle = useAnimatedStyle(() => ({
        opacity: arrowOpacity.value,
        transform: [{ rotate: '145deg' }, { translateY: arrowBob.value }],
    }));

    const popNumber = useCallback(() => {
        numScale.value = withSequence(
            withTiming(1.15, { duration: 55 }),
            withTiming(1, { duration: 140, easing: Easing.out(Easing.cubic) }),
        );
    }, []);

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

    const {
        panGesture,
        ringAnimProps,
        trackAnimProps,
        notchAnimProps,
        trailAnimProps,
        fullCircleAnimProps,
    } = useDialGesture({
        svValue,
        svNewTotal,
        onChange,
        onToggleMode,
        onSecondaryBump: popNumber,
        isSecondary,
        addendOne,
        addendTwo,
        menuOpen,
        center: C,
        radius: R,
        strokeWidth: SW,
    });

    const centerValueAnimProps = useAnimatedProps(() => ({
        text: fmtSigned(svValue.value),
    }));

    const newTotalAnimProps = useAnimatedProps(() => ({
        text: String(svNewTotal.value),
    }));

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
                                <AnimatedTextInput
                                    animatedProps={centerValueAnimProps}
                                    defaultValue={fmtSigned(svValue.value)}
                                    style={[styles.centerNumber, centerNumberFitStyle, { color: ink, padding: 0, backgroundColor: 'transparent' }]}
                                    editable={false}
                                    caretHidden={true}
                                    underlineColorAndroid="transparent"
                                />
                            </Animated.View>
                            <Text style={[styles.centerLabel, { color: inkA(ink, 0.62), fontSize: D * 0.049 }]}>
                                THIS ROUND
                            </Text>
                        </View>
                    </View>

                    {/* Rotation hint arrows — top-left (CCW) and top-right (CW) */}
                    {showHint && (
                        <View style={StyleSheet.absoluteFill} pointerEvents="none">
                            <Animated.View style={[styles.rotHint, {
                                top: D * 0.18, left: D * 0.06,
                            }, leftArrowStyle]}>
                                <Text style={{ color: ink, fontSize: D * 0.1 }}>▲</Text>
                            </Animated.View>
                            <Animated.View style={[styles.rotHint, {
                                top: D * 0.18, right: D * 0.06,
                            }, rightArrowStyle]}>
                                <Text style={{ color: ink, fontSize: D * 0.1 }}>▲</Text>
                            </Animated.View>
                        </View>
                    )}
                </View>
            </GestureDetector>

            {/* Fine-tune row */}
            <View style={[styles.fineTuneRow, { width: D }]}>
                <Pressable
                    testID="btn-decrement"
                    disabled={menuOpen}
                    onPress={() => {
                        onChange(svValue.value - addendOne);
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
                    <View style={styles.newTotalCol} pointerEvents="none">
                        <AnimatedTextInput
                            animatedProps={newTotalAnimProps}
                            defaultValue={String(svNewTotal.value)}
                            style={[styles.newTotalNumber, { color: ink, fontSize: D * 0.18, padding: 0, backgroundColor: 'transparent', textAlign: 'center' }]}
                            editable={false}
                            caretHidden={true}
                            underlineColorAndroid="transparent"
                        />
                        <Text style={[styles.newTotalLabel, { color: inkA(ink, 0.62), fontSize: D * 0.044 }]}>
                            NEW TOTAL
                        </Text>
                    </View>
                )}

                <Pressable
                    testID="btn-increment"
                    disabled={menuOpen}
                    onPress={() => {
                        onChange(svValue.value + addendOne);
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
    rotHint: {
        position: 'absolute',
    },
});

export default React.memo(DialControl);
