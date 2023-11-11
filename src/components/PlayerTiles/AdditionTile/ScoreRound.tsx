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
    fontColor: string;
    containerWidth: number;
}

const ScoreRound: React.FunctionComponent<Props> = ({ containerWidth, roundScore, fontColor }) => {
    const fontSizeRound = useSharedValue(calculateFontSize(containerWidth));
    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: fontSizeRound.value,
        };
    });

    const d = roundScore;

    useEffect(() => {
        fontSizeRound.value = withTiming(
            calculateFontSize(containerWidth) * scaleFactor, { duration: animationDuration }
        );

    }, [roundScore, containerWidth]);

    const scaleFactor = roundScore == 0 ? 1 : .7;

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
