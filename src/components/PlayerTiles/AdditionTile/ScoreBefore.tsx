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

    const scaleFactor = currentRoundScore == 0 ? singleLineScoreSizeMultiplier : multiLineScoreSizeMultiplier;
    const fontScale = useSharedValue(scaleFactor);
    const fontOpacity = useSharedValue(100);
    const baseFontSize = calculateFontSize(containerWidth);

    const animatedStyles = useAnimatedStyle(() => {
        return {
            transform: [{ scale: fontScale.value / scaleFactor }],
            opacity: fontOpacity.value / 100,
        };
    });

    useEffect(() => {
        fontScale.value = withTiming(
            currentRoundScore == 0 ? singleLineScoreSizeMultiplier : multiLineScoreSizeMultiplier,
            { duration: animationDuration }
        );

        fontOpacity.value = withTiming(
            currentRoundScore == 0 ? 100 : scoreMathOpacity * 100,
            { duration: animationDuration }
        );
    }, [currentRoundScore, fontOpacity, fontScale]);

    return (
        <Animated.View entering={enteringAnimation}>
            <Animated.Text
                allowFontScaling={false}
                numberOfLines={1}
                style={[animatedStyles, {
                    // Text layout must update in React's geometry commit, not
                    // in a later Reanimated mapper update on the UI thread.
                    fontSize: baseFontSize * scaleFactor,
                    fontWeight: currentRoundScore == 0 ? 'bold' : 'normal',
                    fontVariant: ['tabular-nums'],
                    color: fontColor,
                }]}>
                {scoreBefore}
            </Animated.Text>
        </Animated.View>
    );
};

export default ScoreBefore;
