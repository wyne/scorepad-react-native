import React, { useEffect } from 'react';

import Animated, {
    SharedValue,
    useDerivedValue,
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';

import AnimatedScoreText from './AnimatedScoreText';
import { calculateFontSize, animationDuration, enteringAnimation, multiLineScoreSizeMultiplier, singleLineScoreSizeMultiplier, scoreMathOpacity } from './Helpers';

interface Props {
    currentRoundScore: number;
    currentRoundTotalScore: number;
    fontColor: string;
    containerWidth: number;
    optimisticCurrentRoundScore?: SharedValue<number>;
    optimisticCurrentRoundTotalScore?: SharedValue<number>;
}

const ScoreBefore: React.FunctionComponent<Props> = ({
    containerWidth,
    currentRoundScore,
    currentRoundTotalScore,
    fontColor,
    optimisticCurrentRoundScore,
    optimisticCurrentRoundTotalScore,
}) => {
    const fallbackRoundScore = useSharedValue(currentRoundScore);
    const fallbackRoundTotalScore = useSharedValue(currentRoundTotalScore);
    const fontSize = useSharedValue(calculateFontSize(containerWidth));
    const fontOpacity = useSharedValue(100);

    const roundScore = optimisticCurrentRoundScore ?? fallbackRoundScore;
    const roundTotalScore = optimisticCurrentRoundTotalScore ?? fallbackRoundTotalScore;
    const hasOptimisticScore = optimisticCurrentRoundScore != null;
    const scoreBefore = useDerivedValue(() => String(roundTotalScore.value - roundScore.value));

    const animatedStyles = useAnimatedStyle(() => {
        const scaleFactor = roundScore.value == 0 ? singleLineScoreSizeMultiplier : multiLineScoreSizeMultiplier;
        return {
            fontSize: hasOptimisticScore ? calculateFontSize(containerWidth) * scaleFactor : fontSize.value,
            fontWeight: roundScore.value == 0 ? 'bold' : 'normal',
            opacity: hasOptimisticScore
                ? (roundScore.value == 0 ? 1 : scoreMathOpacity)
                : fontOpacity.value / 100,
        };
    });

    const scaleFactor = currentRoundScore == 0 ? singleLineScoreSizeMultiplier : multiLineScoreSizeMultiplier;

    useEffect(() => {
        fallbackRoundScore.value = currentRoundScore;
        fallbackRoundTotalScore.value = currentRoundTotalScore;
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
            <AnimatedScoreText
                text={scoreBefore}
                allowFontScaling={false}
                numberOfLines={1}
                style={[animatedStyles, {
                    fontVariant: ['tabular-nums'],
                    color: fontColor,
                    padding: 0,
                    textAlign: 'center',
                    backgroundColor: 'transparent',
                }]}
            />
        </Animated.View>
    );
};

export default ScoreBefore;
