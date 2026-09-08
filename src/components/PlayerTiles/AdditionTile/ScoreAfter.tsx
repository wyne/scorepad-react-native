import React, { useEffect } from 'react';

import Animated, {
    SharedValue,
    useDerivedValue,
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';

import AnimatedScoreText from './AnimatedScoreText';
import { calculateFontSize, animationDuration, enteringAnimation, ZoomOutFadeOut } from './Helpers';
import { scoreStyles } from './scoreStyles';

interface Props {
    currentRoundScore: number;
    currentRoundTotalScore: number;
    fontColor: string;
    containerWidth: number;
    optimisticCurrentRoundScore?: SharedValue<number>;
    optimisticCurrentRoundTotalScore?: SharedValue<number>;
}

const ScoreAfter: React.FunctionComponent<Props> = ({
    containerWidth,
    currentRoundScore,
    currentRoundTotalScore,
    fontColor,
    optimisticCurrentRoundScore,
    optimisticCurrentRoundTotalScore,
}) => {
    const fallbackRoundScore = useSharedValue(currentRoundScore);
    const fallbackRoundTotalScore = useSharedValue(currentRoundTotalScore);
    const roundScore = optimisticCurrentRoundScore ?? fallbackRoundScore;
    const roundTotalScore = optimisticCurrentRoundTotalScore ?? fallbackRoundTotalScore;
    const fontSize = useSharedValue(calculateFontSize(containerWidth));
    const opacity = useSharedValue(1);
    const text = useDerivedValue(() => String(roundTotalScore.value));

    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: fontSize.value,
            opacity: optimisticCurrentRoundScore ? (roundScore.value === 0 ? 0 : 1) : opacity.value,
        };
    });

    useEffect(() => {
        fallbackRoundScore.value = currentRoundScore;
        fallbackRoundTotalScore.value = currentRoundTotalScore;
        fontSize.value = withTiming(
            currentRoundScore == 0 ? 1 : calculateFontSize(containerWidth) * 1.1,
            { duration: animationDuration },
        );
        opacity.value = withTiming(
            currentRoundScore == 0 ? 0 : 1,
            { duration: animationDuration },
        );
    }, [currentRoundScore, containerWidth]);

    return (
        <Animated.View entering={enteringAnimation} exiting={ZoomOutFadeOut}>
            <AnimatedScoreText
                text={text}
                allowFontScaling={false}
                style={[animatedStyles, scoreStyles.scoreText, {
                    color: fontColor,
                    padding: 0,
                    textAlign: 'center',
                    backgroundColor: 'transparent',
                }]}
            />
        </Animated.View>
    );
};


export default ScoreAfter;
