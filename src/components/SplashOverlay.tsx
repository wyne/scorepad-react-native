import React, { useCallback, useEffect } from 'react';

import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

import icon from '../../assets/icon.png';

interface Props {
    backgroundColor: string;
    onDone: () => void;
    ready: boolean;
}

export const SplashOverlay: React.FC<Props> = ({ backgroundColor, onDone, ready }) => {
    const overlayOpacity = useSharedValue(1);
    const iconOpacity = useSharedValue(0);
    const iconScale = useSharedValue(0.92);

    const runDone = useCallback(() => onDone(), [onDone]);

    useEffect(() => {
        void SplashScreen.hideAsync().catch(() => undefined);
    }, []);

    useEffect(() => {
        if (!ready) return;

        iconOpacity.value = withTiming(1, { duration: 350 });

        overlayOpacity.value = withDelay(
            700,
            withTiming(0, { duration: 350, easing: Easing.in(Easing.quad) }, (finished) => {
                if (finished) runOnJS(runDone)();
            })
        );
        iconScale.value = withSequence(
            withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }),
            withDelay(250, withTiming(1.04, { duration: 350, easing: Easing.in(Easing.quad) }))
        );
    }, [ready]);

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
    }));

    const iconStyle = useAnimatedStyle(() => ({
        opacity: iconOpacity.value,
        transform: [{ scale: iconScale.value }],
    }));

    return (
        <Animated.View
            style={[styles.container, { backgroundColor }, overlayStyle]}
            pointerEvents="none"
            testID="splash-overlay"
        >
            <Animated.View style={iconStyle}>
                <Image
                    source={icon}
                    contentFit="contain"
                    style={styles.icon}
                />
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        width: 110,
        height: 110,
        borderRadius: 24,
    },
});
