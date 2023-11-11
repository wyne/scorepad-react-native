import React, { useEffect } from 'react';
import Animated from 'react-native-reanimated';
import {
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';

import { calcFontSize, animationDuration, enteringAnimation } from './Helpers';

interface Props {
    roundScore: number;
    totalScore: number;
    fontColor: string;
    maxWidth: number;
}

const ScoreBefore: React.FunctionComponent<Props> = ({ maxWidth, roundScore, totalScore, fontColor }) => {
    const firstRowLength = (roundScore == 0 ? 0 : roundScore.toString().length + 3) + totalScore.toString().length;
    const d = totalScore - roundScore;

    const fontSize = useSharedValue(calcFontSize(maxWidth, firstRowLength));

    const fontOpacity = useSharedValue(100);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: fontSize.value,
            fontWeight: roundScore == 0 ? 'bold' : 'normal',
            opacity: fontOpacity.value / 100,
        };
    });

    useEffect(() => {
        fontSize.value = withTiming(
            calcFontSize(maxWidth, firstRowLength), { duration: animationDuration }
        );
        console.log("before fontSize (", totalScore, ")", fontSize.value, " [maxWidth=", maxWidth, "]");
        fontOpacity.value = withTiming(
            roundScore == 0 ? 100 : 75, { duration: animationDuration }
        );
    }, [roundScore, maxWidth]);

    return (
        <Animated.View entering={enteringAnimation}>
            <Animated.Text
                numberOfLines={1}
                style={[animatedStyles, {
                    fontVariant: ['tabular-nums'],
                    color: fontColor,
                }]} >
                {d}
            </Animated.Text>
        </Animated.View>
    );
};

export default ScoreBefore;
