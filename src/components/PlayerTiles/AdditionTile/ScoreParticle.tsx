import React, { useEffect } from 'react';

import { StyleSheet } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import {
    estimateParticleTextSize,
    getParticlePlacement,
    PARTICLE_BOX_HEIGHT,
    PARTICLE_BOX_WIDTH,
} from './ScoreParticlePlacement';

/** How long a particle lives, from the tap until it has faded out. */
export const PARTICLE_DURATION = 750;

type Props = {
    value: string;
    /** Where the finger touched, in the touch surface's coordinates. */
    x: number;
    y: number;
    /** Drift up for points added, down for points taken away. */
    direction: 'up' | 'down';
    /** The tile's ink, black or white, so the number reads on any player color. */
    color: string;
    /** A hold adds the larger step, so its number is drawn larger. */
    large?: boolean;
    /** Size of the half-tile touch surface; the tile clips the particle at its outer edge. */
    containerWidth: number;
    containerHeight: number;
};

/**
 * A score change drawn under the finger: it pops in, then drifts away from
 * the score while it fades.
 */
export const ScoreParticle: React.FunctionComponent<Props> = React.memo(({
    value,
    x,
    y,
    direction,
    color,
    large = false,
    containerWidth,
    containerHeight,
}) => {
    const progress = useSharedValue(0);
    // A little sideways jitter keeps quick repeat taps from stacking exactly.
    const [jitter] = React.useState(() => (Math.random() - 0.5) * 14);

    useEffect(() => {
        progress.value = withTiming(1, { duration: PARTICLE_DURATION, easing: Easing.linear });
    }, [progress]);

    const sign = direction === 'up' ? -1 : 1;
    const fontSize = large ? 40 : 30;
    const text = estimateParticleTextSize(value, fontSize);
    const placement = getParticlePlacement(
        x, y, direction, containerWidth, containerHeight, jitter, text.width, text.height
    );

    const animatedStyle = useAnimatedStyle(() => {
        const t = progress.value * PARTICLE_DURATION;
        const drift = 1 - Math.pow(1 - progress.value, 3);
        return {
            opacity: interpolate(t, [0, 90, 330, PARTICLE_DURATION], [0, 1, 1, 0], 'clamp'),
            transform: [
                { translateY: sign * placement.drift * drift },
                { scale: interpolate(t, [0, 140, 260], [0.55, 1.15, 1], 'clamp') },
            ],
        };
    });

    const shadowColor = color.toLowerCase().startsWith('#000') ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';

    return (
        <Animated.View
            pointerEvents="none"
            style={[styles.box, { left: placement.left, top: placement.top }, animatedStyle]}
        >
            <Animated.Text
                allowFontScaling={false}
                style={[styles.text, { color, fontSize, textShadowColor: shadowColor }]}
            >
                {value}
            </Animated.Text>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    box: {
        position: 'absolute',
        width: PARTICLE_BOX_WIDTH,
        height: PARTICLE_BOX_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: '800',
        textAlign: 'center',
        fontVariant: ['tabular-nums'],
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
});
