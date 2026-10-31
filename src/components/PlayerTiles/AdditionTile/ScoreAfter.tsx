import React, { useEffect } from 'react';

import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';

import { calculateFontSize, animationDuration, enteringAnimation, ZoomOutFadeOut } from './Helpers';
import { scoreStyles } from './scoreStyles';

interface Props {
    currentRoundScore: number;
    currentRoundTotalScore: number;
    fontColor: string;
    containerWidth: number;
}

const ScoreAfter: React.FunctionComponent<Props> = ({ containerWidth, currentRoundScore, currentRoundTotalScore, fontColor }) => {
    const fontScale = useSharedValue(currentRoundScore == 0 ? 0 : 1);
    const opacity = useSharedValue(currentRoundScore == 0 ? 0 : 1);
    const baseFontSize = calculateFontSize(containerWidth);

    const animatedStyles = useAnimatedStyle(() => {
        return {
            transform: [{ scale: fontScale.value }],
            opacity: opacity.value,
        };
    });

    useEffect(() => {
        fontScale.value = withTiming(
            currentRoundScore == 0 ? 0 : 1,
            { duration: animationDuration },
        );
        opacity.value = withTiming(
            currentRoundScore == 0 ? 0 : 1,
            { duration: animationDuration },
        );
    }, [currentRoundScore, fontScale, opacity]);

    return (
        <Animated.View entering={enteringAnimation} exiting={ZoomOutFadeOut}>
            <Animated.Text
                allowFontScaling={false}
                style={[animatedStyles, scoreStyles.scoreText, {
                    fontSize: currentRoundScore == 0 ? 1 : baseFontSize * 1.1,
                    color: fontColor,
                }]}>
                {currentRoundTotalScore}
            </Animated.Text>
        </Animated.View>
    );
};


export default ScoreAfter;
