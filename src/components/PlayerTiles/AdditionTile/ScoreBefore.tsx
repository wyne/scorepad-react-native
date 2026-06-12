import React, { useEffect } from 'react';

import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';

import { calculateFontSize, animationDuration, enteringAnimation, multiLineScoreSizeMultiplier, singleLineScoreSizeMultiplier, scoreMathOpacity } from './Helpers';

interface Props {
    currentRoundScore: number;
    currentRoundTotalScore: number;
    fontColor: string;
    containerWidth: number;
}

const ScoreBefore: React.FunctionComponent<Props> = ({
    containerWidth,
    currentRoundScore,
    currentRoundTotalScore,
    fontColor
}) => {
    const scoreBefore = currentRoundTotalScore - currentRoundScore;

    const fontSize = useSharedValue(calculateFontSize(containerWidth));
    const fontOpacity = useSharedValue(100);

    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: fontSize.value,
            fontWeight: currentRoundScore == 0 ? 'bold' : 'normal',
            opacity: fontOpacity.value / 100,
        };
    });

    const scaleFactor = currentRoundScore == 0 ? singleLineScoreSizeMultiplier : multiLineScoreSizeMultiplier;

    useEffect(() => {
        fontSize.value = withTiming(
            calculateFontSize(containerWidth) * scaleFactor,
            { duration: animationDuration }
        );

        fontOpacity.value = withTiming(
            currentRoundScore == 0 ? 100 : scoreMathOpacity * 100,
            { duration: animationDuration }
        );
    }, [currentRoundScore, containerWidth]);

    return (
        <Animated.View entering={enteringAnimation}>
            <Animated.Text
                allowFontScaling={false}
                numberOfLines={1}
                style={[animatedStyles, {
                    fontVariant: ['tabular-nums'],
                    color: fontColor,
                }]}>
                {scoreBefore}
            </Animated.Text>
        </Animated.View>
    );
};

export default ScoreBefore;
