import React, { useEffect } from 'react';
import Animated from 'react-native-reanimated';
import {
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';

import { calculateFontSize, animationDuration, multiLineScoreSizeMultiplier, scoreMathOpacity } from './Helpers';

interface Props {
    roundScore: number;
    fontColor: string;
    containerWidth: number;
}

const ScoreRound: React.FunctionComponent<Props> = ({ containerWidth, roundScore, fontColor }) => {
    const fontSize = useSharedValue(calculateFontSize(containerWidth));

    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: fontSize.value,
        };
    });

    const d = roundScore;

    useEffect(() => {
        fontSize.value = withTiming(
            calculateFontSize(containerWidth) * multiLineScoreSizeMultiplier,
            { duration: animationDuration }
        );

    }, [roundScore, containerWidth]);

    if (roundScore == 0) {
        return <></>;
    }

    return (
        <Animated.View>
            <Animated.Text numberOfLines={1}
                style={[animatedStyles, {
                    fontVariant: ['tabular-nums'],
                    color: fontColor,
                    opacity: scoreMathOpacity
                }]}>
                {roundScore > 0 && " + "}
                {roundScore < 0 && " - "}
                {Math.abs(d)}
            </Animated.Text>
        </Animated.View>
    );
};

export default ScoreRound;
