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
}

const ScoreBefore: React.FunctionComponent<Props> = ({ roundScore, totalScore, fontColor }) => {
    const firstRowLength = (roundScore == 0 ? 0 : roundScore.toString().length + 3) + totalScore.toString().length;
    const d = totalScore - roundScore;

    const fontSize = useSharedValue(calcFontSize(firstRowLength));
    const fontOpacity = useSharedValue(100);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: roundScore == 0 ? fontSize.value : fontSize.value * .8,
            fontWeight: roundScore == 0 ? 'bold' : 'normal',
            opacity: fontOpacity.value / 100,
        };
    });

    useEffect(() => {
        fontSize.value = withTiming(
            calcFontSize(firstRowLength), { duration: animationDuration }
        );
        fontOpacity.value = withTiming(
            roundScore == 0 ? 100 : 75, { duration: animationDuration }
        );
    }, [roundScore]);

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
