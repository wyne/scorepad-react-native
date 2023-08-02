import React, { useEffect } from 'react';
import Animated from 'react-native-reanimated';
import {
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native';

import { calcFontSize, animationDuration, enteringAnimation, ZoomOutFadeOut } from './Helpers';

interface Props {
    roundScore: number;
    totalScore: number;
    fontColor: string;
}

const ScoreAfter: React.FunctionComponent<Props> = ({ roundScore, totalScore, fontColor }) => {
    const fontSize = useSharedValue(calcFontSize(totalScore.toString().length));
    const opacity = useSharedValue(1);

    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: fontSize.value,
            opacity: opacity.value,
        };
    });

    useEffect(() => {
        fontSize.value = withTiming(
            roundScore == 0 ? 1 : calcFontSize(totalScore.toString().length), { duration: animationDuration },
        );
        opacity.value = withTiming(
            roundScore == 0 ? 0 : 1, { duration: animationDuration },
        );
    }, [roundScore]);

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