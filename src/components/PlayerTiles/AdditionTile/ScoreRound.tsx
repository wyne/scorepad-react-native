import React, { useEffect, useRef } from 'react';

import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';

import { calculateFontSize, animationDuration, multiLineScoreSizeMultiplier, scoreMathOpacity } from './Helpers';

interface Props {
    currentRoundScore: number;
    fontColor: string;
    containerWidth: number;
}

const ScoreRound: React.FunctionComponent<Props> = ({ containerWidth, currentRoundScore, fontColor }) => {
    const initialRender = useRef(true);
    const fontSize = useSharedValue(calculateFontSize(containerWidth) * multiLineScoreSizeMultiplier);

    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: fontSize.value,
        };
    });

    const d = currentRoundScore;

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }

        fontSize.value = withTiming(
            calculateFontSize(containerWidth) * multiLineScoreSizeMultiplier,
            { duration: animationDuration }
        );

    }, [currentRoundScore, containerWidth]);

    if (currentRoundScore == 0) {
        return <></>;
    }

    return (
        <Animated.View>
            <Animated.Text numberOfLines={1}
                allowFontScaling={false}
                style={[animatedStyles, {
                    fontVariant: ['tabular-nums'],
                    color: fontColor,
                    opacity: scoreMathOpacity
                }]}>
                {currentRoundScore > 0 && ' + '}
                {currentRoundScore < 0 && ' - '}
                {Math.abs(d)}
            </Animated.Text>
        </Animated.View>
    );
};

export default ScoreRound;
