import React, { useCallback, useEffect } from 'react';

import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet, useColorScheme } from 'react-native';
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
    onDone: () => void;
}

export const SplashOverlay: React.FC<Props> = ({ onDone }) => {
    const colorScheme = useColorScheme();
    const bgColor = colorScheme === 'dark' ? '#000000' : '#F2F2F7';

    const overlayOpacity = useSharedValue(1);
    const iconOpacity = useSharedValue(0);
    const iconScale = useSharedValue(0.92);

    const runDone = useCallback(() => onDone(), [onDone]);

    useEffect(() => {
        SplashScreen.hideAsync();

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
    }, []);

    const overlayStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
    }));

    const iconStyle = useAnimatedStyle(() => ({
        opacity: iconOpacity.value,
        transform: [{ scale: iconScale.value }],
    }));

    return (
        <Animated.View
            style={[styles.container, { backgroundColor: bgColor }, overlayStyle]}
            pointerEvents="none"
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
