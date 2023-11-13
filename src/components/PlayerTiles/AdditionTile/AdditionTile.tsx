import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
} from 'react-native-reanimated';

import { animationDuration, calculateFontSize } from './Helpers';
import ScoreBefore from './ScoreBefore';
import ScoreAfter from './ScoreAfter';
import ScoreRound from './ScoreRound';

interface Props {
    playerName: string;
    totalScore: number;
    roundScore: number;
    fontColor: string;
    maxWidth: number | null;
    maxHeight: number | null;
    index: number;
}

const AdditionTile: React.FunctionComponent<Props> = ({
    playerName,
    totalScore,
    roundScore,
    fontColor,
    maxWidth,
    maxHeight,
}) => {

    if (maxWidth == null || maxHeight == null) return null;

    const containerShortEdge = Math.min(maxWidth, maxHeight);

    const playerNameFontSize = calculateFontSize(maxWidth);

    const dynamicPlayerStyles = {
        fontSize: playerNameFontSize,
        color: fontColor,
    };

    return (
        <Animated.View style={[{ justifyContent: 'center' }]}>
            <Animated.Text style={[styles.name, dynamicPlayerStyles]} numberOfLines={1}>
                {playerName}
            </Animated.Text>

            <Animated.View style={styles.scoreLineOne}>
                <ScoreBefore containerWidth={containerShortEdge} roundScore={roundScore} totalScore={totalScore}
                    fontColor={fontColor} />
                <ScoreRound containerWidth={containerShortEdge} roundScore={roundScore}
                    fontColor={fontColor} />
            </Animated.View>

            <ScoreAfter containerWidth={containerShortEdge} roundScore={roundScore} totalScore={totalScore}
                fontColor={fontColor} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    name: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
    scoreLineOne: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AdditionTile;
