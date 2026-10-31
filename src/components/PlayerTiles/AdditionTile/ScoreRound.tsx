import React, { useEffect } from 'react';

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
    const d = currentRoundScore;
    const baseFontSize = calculateFontSize(containerWidth);

    // When it first appears, the round score shrinks into place from the full
    // score size.
    const fontScale = useSharedValue(1);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: baseFontSize * fontScale.value,
        };
    });

    useEffect(() => {
        fontScale.value = withTiming(multiLineScoreSizeMultiplier, { duration: animationDuration });
    }, [fontScale]);

    if (currentRoundScore == 0) {
        return <></>;
    }

    return (
        <Animated.View>
            <Animated.Text numberOfLines={1}
                // A resize mounts fresh text at the new size, so it lands in
                // the same commit as the tile instead of a frame later.
                key={baseFontSize}
                allowFontScaling={false}
                style={[animatedStyles, {
                    fontSize: baseFontSize * multiLineScoreSizeMultiplier,
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
