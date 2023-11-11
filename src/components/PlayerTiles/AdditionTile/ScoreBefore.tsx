import React, { useEffect } from 'react';
import Animated from 'react-native-reanimated';
import {
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';

import { calculateFontSize, animationDuration, enteringAnimation } from './Helpers';

interface Props {
    roundScore: number;
    totalScore: number;
    fontColor: string;
    containerWidth: number;
}

const ScoreBefore: React.FunctionComponent<Props> = ({
    containerWidth,
    roundScore,
    totalScore,
    fontColor
}) => {
    const scoreBefore = totalScore - roundScore;

    const fontSize = useSharedValue(calculateFontSize(containerWidth));
    const fontOpacity = useSharedValue(100);

    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: fontSize.value,
            fontWeight: roundScore == 0 ? 'bold' : 'normal',
            opacity: fontOpacity.value / 100,
        };
    });

    const scaleFactor = roundScore == 0 ? 1 : .8;

    useEffect(() => {
        fontSize.value = withTiming(
            calculateFontSize(containerWidth) * scaleFactor,
            { duration: animationDuration }
        );

        fontOpacity.value = withTiming(
            roundScore == 0 ? 100 : 75,
            { duration: animationDuration }
        );
    }, [roundScore, containerWidth]);

    return (
        <Animated.View entering={enteringAnimation}>
            <Animated.Text
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
