import React, { useEffect } from 'react';

import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    cancelAnimation,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import { InteractionType } from './InteractionType';

interface Props {
    interactionType: InteractionType;
    width: number;
    height: number;
    /** Tile colour behind the demo. */
    color: string;
    /** Foreground colour drawn on the tile. */
    ink?: string;
    /** Score shown as the demo lands, e.g. "+1". */
    label: string;
    testID?: string;
}

const LOOP_MS = 1800;

/**
 * A small looping picture of a scoring gesture on a single tile: a finger
 * tapping the top half, dragging up, or turning the dial ring. Used by the
 * first-use toast and the How to Score sheet so the player tiles themselves
 * stay clean. With Reduce Motion on it holds the final frame.
 */
const GestureDemo: React.FC<Props> = ({ interactionType, width, height, color, ink = '#fff', label, testID }) => {
    const reduceMotion = useReducedMotion();
    // 0 → 1 over one pass of the gesture, then a pause before it repeats.
    const t = useSharedValue(reduceMotion ? 1 : 0);

    useEffect(() => {
        if (reduceMotion) {
            t.value = 1;
            return;
        }
        t.value = 0;
        t.value = withRepeat(
            withSequence(
                withDelay(250, withTiming(1, { duration: LOOP_MS - 700, easing: Easing.inOut(Easing.quad) })),
                withDelay(450, withTiming(0, { duration: 0 })),
            ),
            -1,
            false,
        );
        return () => cancelAnimation(t);
    }, [reduceMotion, interactionType, t]);

    const scale = Math.min(width, height) / 66;
    const finger = Math.max(16, 16 * Math.min(scale, 2.4));
    const fontSize = Math.max(11, 11 * Math.min(scale, 2.4) * (scale > 1.5 ? 1.3 : 1));

    // Finger position, as a fraction of the tile height, for tap and swipe.
    const fingerStyle = useAnimatedStyle(() => {
        if (interactionType === InteractionType.SwipeVertical) {
            const y = height * (0.72 - 0.47 * t.value);
            return { opacity: t.value < 0.98 ? 1 : 0.6, transform: [{ translateY: y - finger / 2 }] };
        }
        // Tap: press in the middle of the loop.
        const press = t.value > 0.35 && t.value < 0.55 ? 0.82 : 1;
        return { opacity: 1, transform: [{ translateY: height * 0.25 - finger / 2 }, { scale: press }] };
    });

    const rippleStyle = useAnimatedStyle(() => {
        const p = Math.max(0, Math.min(1, (t.value - 0.45) / 0.55));
        return { opacity: p === 0 ? 0 : 0.6 * (1 - p), transform: [{ scale: 0.6 + p * 1.4 }] };
    });

    const labelStyle = useAnimatedStyle(() => {
        const p = Math.max(0, Math.min(1, (t.value - 0.55) / 0.45));
        return { opacity: p, transform: [{ translateY: -6 * p }] };
    });

    const trailStyle = useAnimatedStyle(() => ({
        height: height * 0.47 * t.value,
        top: height * (0.72 - 0.47 * t.value),
    }));

    // Dial: the finger rides the ring from 12 o'clock to about 2 o'clock.
    const ringSize = Math.min(width, height) * 0.74;
    const ringStroke = Math.max(5, ringSize * 0.1);
    const dialStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${70 * t.value}deg` }],
    }));

    const inkA = (a: number) => (ink === '#fff' ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`);

    return (
        <View
            testID={testID}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={[styles.tile, { width, height, backgroundColor: color, borderRadius: Math.max(10, 10 * Math.min(scale, 2)) }]}
        >
            {interactionType === InteractionType.HalfTap && (
                <>
                    <View style={[styles.half, { height: height / 2, backgroundColor: inkA(0.14) }]} />
                    <View style={[styles.midline, { top: height / 2, borderColor: inkA(0.4) }]} />
                    <Text style={[styles.minus, { color: inkA(0.55), fontSize: fontSize * 1.1 }]}>−</Text>
                    <Animated.View style={[styles.centered, { width: finger * 2, height: finger * 2, left: width / 2 - finger, top: height * 0.25 - finger }, rippleStyle]}>
                        <View style={[styles.ripple, { borderRadius: finger, borderColor: inkA(0.9) }]} />
                    </Animated.View>
                </>
            )}

            {interactionType === InteractionType.SwipeVertical && (
                <Animated.View style={[styles.trail, { width: finger / 2, left: width / 2 - finger / 4, borderRadius: finger / 4 }, trailStyle]} />
            )}

            {interactionType !== InteractionType.Dial && (
                <Animated.View style={[styles.finger, { width: finger, height: finger, borderRadius: finger / 2, left: width / 2 - finger / 2 }, fingerStyle]} />
            )}

            {interactionType === InteractionType.Dial && (
                <View style={[styles.ringWrap, { width: ringSize, height: ringSize, left: (width - ringSize) / 2, top: (height - ringSize) / 2 }]}>
                    <View style={[StyleSheet.absoluteFill, { borderRadius: ringSize / 2, borderWidth: ringStroke, borderColor: inkA(0.25) }]} />
                    <Animated.View style={[StyleSheet.absoluteFill, dialStyle]}>
                        <View style={[styles.finger, {
                            width: finger * 0.9, height: finger * 0.9, borderRadius: finger,
                            left: ringSize / 2 - finger * 0.45, top: ringStroke / 2 - finger * 0.45,
                        }]} />
                    </Animated.View>
                </View>
            )}

            <Animated.Text
                style={[
                    styles.label,
                    { color: ink, fontSize },
                    interactionType === InteractionType.Dial
                        ? { left: 0, right: 0, top: height / 2 - fontSize * 0.7, textAlign: 'center', fontSize: fontSize * 1.2 }
                        : { left: width / 2 + finger * 0.75, top: height * 0.04 },
                    labelStyle,
                ]}
            >
                {label}
            </Animated.Text>
        </View>
    );
};

const styles = StyleSheet.create({
    tile: {
        overflow: 'hidden',
        position: 'relative',
    },
    half: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    midline: {
        position: 'absolute',
        left: '6%',
        right: '6%',
        borderTopWidth: 1.5,
        borderStyle: 'dashed',
    },
    minus: {
        position: 'absolute',
        bottom: '3%',
        left: 0,
        right: 0,
        textAlign: 'center',
        fontWeight: '300',
    },
    centered: {
        position: 'absolute',
    },
    ripple: {
        flex: 1,
        borderWidth: 2,
    },
    trail: {
        position: 'absolute',
        backgroundColor: 'rgba(255,255,255,0.45)',
    },
    finger: {
        position: 'absolute',
        top: 0,
        backgroundColor: 'rgba(255,255,255,0.92)',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    ringWrap: {
        position: 'absolute',
    },
    label: {
        position: 'absolute',
        fontWeight: '800',
    },
});

export default GestureDemo;
