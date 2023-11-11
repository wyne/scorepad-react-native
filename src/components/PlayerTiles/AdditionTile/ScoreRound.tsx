import React, { useEffect } from 'react';
import Animated from 'react-native-reanimated';
import {
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';

import { calculateFontSize, animationDuration } from './Helpers';

interface Props {
    roundScore: number;
    totalScore: number;
    fontColor: string;
    containerWidth: number;
}

const ScoreRound: React.FunctionComponent<Props> = ({ containerWidth, roundScore, totalScore, fontColor }) => {
    const firstRowLength = (roundScore == 0 ? 0 : roundScore.toString().length + 3) + totalScore.toString().length;
    const fontSizeRound = useSharedValue(calculateFontSize(containerWidth, firstRowLength));
    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: fontSizeRound.value,
        };
    });

    const d = roundScore;

    useEffect(() => {
        fontSizeRound.value = withTiming(
            calculateFontSize(containerWidth, firstRowLength), { duration: animationDuration }
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
                    color: fontColor, opacity: .75
                }]}>
                {roundScore > 0 && " + "}
                {roundScore < 0 && " - "}
                {Math.abs(d)}
            </Animated.Text>
        </Animated.View>
    );
};

export default ScoreRound;
