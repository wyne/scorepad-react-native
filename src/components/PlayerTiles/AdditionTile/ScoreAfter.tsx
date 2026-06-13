import React, { useEffect, useRef } from 'react';

import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';

import { calculateFontSize, animationDuration, ZoomOutFadeOut } from './Helpers';
import { scoreStyles } from './scoreStyles';

interface Props {
    currentRoundScore: number;
    currentRoundTotalScore: number;
    fontColor: string;
    containerWidth: number;
}

const ScoreAfter: React.FunctionComponent<Props> = ({ containerWidth, currentRoundScore, currentRoundTotalScore, fontColor }) => {
    const initialRender = useRef(true);
    const fontSize = useSharedValue(currentRoundScore == 0 ? 1 : calculateFontSize(containerWidth) * 1.1);
    const opacity = useSharedValue(currentRoundScore == 0 ? 0 : 1);

    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: fontSize.value,
            opacity: opacity.value,
        };
    });

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;
            return;
        }

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
        <Animated.View exiting={ZoomOutFadeOut}>
            <Animated.Text
                allowFontScaling={false}
                style={[animatedStyles, scoreStyles.scoreText, { color: fontColor }]}>
                {currentRoundTotalScore}
            </Animated.Text>
        </Animated.View>
    );
};


export default ScoreAfter;
