import React, { useEffect } from 'react';

import { StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';

import { calculateFontSize, animationDuration, enteringAnimation, ZoomOutFadeOut } from './Helpers';

interface Props {
    roundScore: number;
    totalScore: number;
    fontColor: string;
    containerWidth: number;
}

const ScoreAfter: React.FunctionComponent<Props> = ({ containerWidth, roundScore, totalScore, fontColor }) => {
    const fontSize = useSharedValue(calculateFontSize(containerWidth));
    const opacity = useSharedValue(1);

    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: fontSize.value,
            opacity: opacity.value,
        };
    });

    useEffect(() => {
        fontSize.value = withTiming(
            roundScore == 0 ? 1 : calculateFontSize(containerWidth) * 1.1,
            { duration: animationDuration },
        );
        opacity.value = withTiming(
            roundScore == 0 ? 0 : 1,
            { duration: animationDuration },
        );
    }, [roundScore, containerWidth]);

    return (
        <Animated.View entering={enteringAnimation} exiting={ZoomOutFadeOut}>
            <Animated.Text
                style={[animatedStyles, styles.scoreTotal, { color: fontColor }]}>
                {totalScore}
            </Animated.Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    scoreTotal: {
        fontVariant: ['tabular-nums'],
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default ScoreAfter;
