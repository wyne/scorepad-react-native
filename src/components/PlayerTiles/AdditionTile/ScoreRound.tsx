import React, { useEffect } from 'react';
import Animated from 'react-native-reanimated';
import {
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';

import { calcFontSize, animationDuration } from './Helpers';

interface Props {
    roundScore: number;
    totalScore: number;
    fontColor: string;
    maxWidth: number;
}

const ScoreRound: React.FunctionComponent<Props> = ({ maxWidth, roundScore, totalScore, fontColor }) => {
    const firstRowLength = (roundScore == 0 ? 0 : roundScore.toString().length + 3) + totalScore.toString().length;
    const fontSizeRound = useSharedValue(calcFontSize(maxWidth, firstRowLength));
    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: fontSizeRound.value,
        };
    });

    const d = roundScore;

    useEffect(() => {
        fontSizeRound.value = withTiming(
            calcFontSize(maxWidth, firstRowLength), { duration: animationDuration }
        );
        console.log("round fontSize (", totalScore, ")", fontSizeRound.value, " [maxWidth=", maxWidth, "]");
    }, [roundScore, maxWidth]);

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
