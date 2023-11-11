import React, { useEffect, useState } from 'react';
import { StyleSheet, LayoutChangeEvent } from 'react-native';
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
    // Tile width and height
    const [tileWidth, setTileWidth] = useState(1);
    const [tileHeight, setTileHeight] = useState(1);

    // Animation values
    const sharedScale = useSharedValue(1);
    const sharedOpacity = useSharedValue(0);

    // Animation styles for resizing due to text changes
    const animatedStyles = useAnimatedStyle(() => {
        return {
            transform: [{ scale: sharedScale.value }],
            opacity: sharedOpacity.value,
        };
    });


    // Update tile width and height on layout change
    const layoutHandler = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setTileHeight(height);
        setTileWidth(width);
    };

    useEffect(() => {
        /*
         * Calculate ratio of tile content to max width/height
         * determined by the parent container
         */
        const horizontalScaleRatio = maxWidth / tileWidth;
        const verticalScaleRatio = maxHeight / tileHeight;

        // Allow for padding by not scaling to full width/height
        const maxTileCoverage = 0.8; // 80%

        const minimumScale = Math.min(
            horizontalScaleRatio * maxTileCoverage,
            verticalScaleRatio * maxTileCoverage
        );

        if (minimumScale > 0) {
            sharedScale.value = withDelay(
                animationDuration,
                withTiming(
                    minimumScale, { duration: animationDuration }
                )
            );
        }

        // Delay opacity animation to allow for scale animation to finish
        // and to allow for the previous tile to finish animating for effect
        const animationDelay = index * animationDuration / 2;

        sharedOpacity.value = withDelay(
            animationDelay,
            withTiming(
                1,
                { duration: animationDuration * 2 }
            )
        );
    });

    const playerNameFontSize = calculateFontSize(maxWidth, playerName.length);

    const containerWidth = Math.min(maxWidth, maxHeight);

    const dynamicPlayerStyles = {
        fontSize: playerNameFontSize,
        color: fontColor,
    };

    return (
        <Animated.View style={[animatedStyles, { justifyContent: 'center' }]} onLayout={layoutHandler}>
            <Animated.Text style={[styles.name, dynamicPlayerStyles]} numberOfLines={1}>
                {playerName}
            </Animated.Text>
            <Animated.View
                style={styles.scoreLineOne} >
                <ScoreBefore containerWidth={containerWidth} roundScore={roundScore} totalScore={totalScore}
                    fontColor={fontColor} />
                <ScoreRound containerWidth={containerWidth} roundScore={roundScore} totalScore={totalScore}
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
