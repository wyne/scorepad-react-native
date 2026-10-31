import React from 'react';

import Animated from 'react-native-reanimated';

import { calculateFontSize, multiLineScoreSizeMultiplier, scoreMathOpacity } from './Helpers';

interface Props {
    currentRoundScore: number;
    fontColor: string;
    containerWidth: number;
}

const ScoreRound: React.FunctionComponent<Props> = ({ containerWidth, currentRoundScore, fontColor }) => {
    const d = currentRoundScore;

    if (currentRoundScore == 0) {
        return <></>;
    }

    return (
        <Animated.View>
            <Animated.Text numberOfLines={1}
                allowFontScaling={false}
                style={[{
                    fontSize: calculateFontSize(containerWidth) * multiLineScoreSizeMultiplier,
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
