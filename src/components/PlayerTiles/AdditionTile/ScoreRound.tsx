import React, { useEffect } from 'react';

import Animated, {
    SharedValue,
    useDerivedValue,
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';

import AnimatedScoreText from './AnimatedScoreText';
import { calculateFontSize, animationDuration, multiLineScoreSizeMultiplier, scoreMathOpacity } from './Helpers';

interface Props {
    currentRoundScore: number;
    fontColor: string;
    containerWidth: number;
    optimisticCurrentRoundScore?: SharedValue<number>;
}

const ScoreRound: React.FunctionComponent<Props> = ({
    containerWidth,
    currentRoundScore,
    fontColor,
    optimisticCurrentRoundScore,
}) => {
    const fallbackRoundScore = useSharedValue(currentRoundScore);
    const roundScore = optimisticCurrentRoundScore ?? fallbackRoundScore;
    const fontSize = useSharedValue(calculateFontSize(containerWidth));
    const text = useDerivedValue(() => {
        if (roundScore.value === 0) return '';
        const sign = roundScore.value > 0 ? ' + ' : ' - ';
        return sign + Math.abs(roundScore.value);
    });

    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: fontSize.value,
            opacity: roundScore.value === 0 ? 0 : scoreMathOpacity,
        };
    });

    useEffect(() => {
        fallbackRoundScore.value = currentRoundScore;
        fontSize.value = withTiming(
            calculateFontSize(containerWidth) * multiLineScoreSizeMultiplier,
            { duration: animationDuration }
        );

    }, [currentRoundScore, containerWidth]);

    return (
        <Animated.View>
            <AnimatedScoreText
                text={text}
                numberOfLines={1}
                allowFontScaling={false}
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

export default ScoreRound;
