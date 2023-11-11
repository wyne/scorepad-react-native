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
    index
}) => {

    if (maxWidth == null || maxHeight == null) return null;

    // Animation values
    const sharedScale = useSharedValue(1);
    const sharedOpacity = useSharedValue(0);

    /**
     * Animation styles for resizing due to text changes
     */
    const animatedStyles = useAnimatedStyle(() => {
        return {
            opacity: sharedOpacity.value,
        };
    });


    useEffect(() => {
        // Delay opacity animation to allow for scale animation to finish
        // and to allow for the previous tile to finish animating for effect
        const animationDelay = (index + 1) * animationDuration / 2;

        sharedOpacity.value = withDelay(
            animationDelay,
            withTiming(
                1,
                { duration: animationDuration * 2 }
            )
        );
        return;
    }, [
        playerName,
        totalScore,
        roundScore,
        maxWidth,
        maxHeight,
        sharedScale.value
    ]);

    const containerWidth = Math.min(maxWidth, maxHeight);

    const playerNameFontSize = calculateFontSize(maxWidth);

    const dynamicPlayerStyles = {
        fontSize: playerNameFontSize,
        color: fontColor,
    };

    return (
        <Animated.View style={[animatedStyles, { justifyContent: 'center' }]}>
            <Animated.Text style={[styles.name, dynamicPlayerStyles]} numberOfLines={1}>
                {playerName}
            </Animated.Text>
            <Animated.View
                style={styles.scoreLineOne} >
                <ScoreBefore containerWidth={containerWidth} roundScore={roundScore} totalScore={totalScore}
                    fontColor={fontColor} />
                <ScoreRound containerWidth={containerWidth} roundScore={roundScore}
                    fontColor={fontColor} />
            </Animated.View>
            <ScoreAfter containerWidth={containerWidth} roundScore={roundScore} totalScore={totalScore}
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
