import React, { useEffect } from 'react';

import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';

import { calculateFontSize, animationDuration, enteringAnimation, ZoomOutFadeOut } from './Helpers';
import { scoreStyles } from './scoreStyles';

interface Props {
    currentRoundScore: number;
    currentRoundTotalScore: number;
    fontColor: string;
    containerWidth: number;
}

const ScoreAfter: React.FunctionComponent<Props> = ({ containerWidth, currentRoundScore, currentRoundTotalScore, fontColor }) => {
    const fontScale = useSharedValue(currentRoundScore == 0 ? 0 : 1);
    const opacity = useSharedValue(currentRoundScore == 0 ? 0 : 1);
    const baseFontSize = calculateFontSize(containerWidth);

    // A score change grows the total from nothing, so the lines above it move
    // up as it does.
    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: Math.max(1, baseFontSize * 1.1 * fontScale.value),
            opacity: opacity.value,
        };
    });

    useEffect(() => {
        fontScale.value = withTiming(
            currentRoundScore == 0 ? 0 : 1,
            { duration: animationDuration },
        );
        opacity.value = withTiming(
            currentRoundScore == 0 ? 0 : 1,
            { duration: animationDuration },
        );
    }, [currentRoundScore, fontScale, opacity]);

    return (
        <Animated.View entering={enteringAnimation} exiting={ZoomOutFadeOut}>
            <Animated.Text
                // A resize mounts fresh text at the new size, so it lands in
                // the same commit as the tile instead of a frame later.
                key={baseFontSize}
                allowFontScaling={false}
                style={[animatedStyles, scoreStyles.scoreText, {
                    fontSize: currentRoundScore == 0 ? 1 : baseFontSize * 1.1,
                    color: fontColor,
                }]}>
                {currentRoundTotalScore}
            </Animated.Text>
        </Animated.View>
    );
};


export default ScoreAfter;
