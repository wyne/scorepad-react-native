import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
} from 'react-native-reanimated';

import { animationDuration, calcFontSize } from './Helpers';
import ScoreBefore from './ScoreBefore';
import ScoreAfter from './ScoreAfter';
import ScoreRound from './ScoreRound';

interface Props {
    playerName: string;
    totalScore: number;
    roundScore: number;
    fontColor: string;
    maxWidth: number;
    maxHeight: number;
    index: number;
}

const AdditionTile: React.FunctionComponent<Props> = ({
    playerName,
    totalScore,
    roundScore,
    fontColor,
    maxWidth,
    maxHeight,
    index
}) => {

    const sharedOpacity = useSharedValue(0);

    const animatedStyles = useAnimatedStyle(() => {
        return {
            opacity: sharedOpacity.value,
        };
    });

    useEffect(() => {
        sharedOpacity.value = withDelay(100 + index * animationDuration / 2, withTiming(
            1, { duration: animationDuration * 2 }
        ));
    });

    const playerNameFontSize = calcFontSize(maxWidth, playerName.length) * .8;

    return (
        <Animated.View style={[animatedStyles, { justifyContent: 'center' }]}>
            <Animated.Text style={[styles.name, { textTransform: 'uppercase', fontSize: playerNameFontSize, color: fontColor }]}
                numberOfLines={1} >
                {playerName}
            </Animated.Text>
            <Animated.View
                style={styles.scoreLineOne} >
                <ScoreBefore maxWidth={Math.min(maxWidth, maxHeight)} roundScore={roundScore} totalScore={totalScore}
                    fontColor={fontColor} />
                <ScoreRound maxWidth={Math.min(maxWidth, maxHeight)} roundScore={roundScore} totalScore={totalScore}
                    fontColor={fontColor} />
            </Animated.View>
            <ScoreAfter maxWidth={Math.min(maxWidth, maxHeight)} roundScore={roundScore} totalScore={totalScore}
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
