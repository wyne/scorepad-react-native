import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
} from 'react-native-reanimated';

import { animationDuration, calcPlayerFontSize, calcScoreLengthRatio } from './Helpers';
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
    const [w, setW] = useState(1);
    const [h, setH] = useState(1);

    const sharedScale = useSharedValue(1);

    const animatedStyles = useAnimatedStyle(() => {
        return {
            transform: [{ scale: sharedScale.value }],
        };
    });

    const layoutHandler = (e: LayoutChangeEvent) => {
        const { x, y, width, height } = e.nativeEvent.layout;
        setH(height);
        setW(width);
    };

    useEffect(() => {
        const hs = maxWidth / w;
        const vs = maxHeight / h;
        const scoreLengthRatio = calcScoreLengthRatio(totalScore.toString().length);
        const widthRatio = (900 + maxWidth) / (900 + Dimensions.get("window").width);

        if (Math.min(hs, vs) > 0) {
            const s = Math.min(widthRatio * scoreLengthRatio * hs, widthRatio * scoreLengthRatio * vs);
            sharedScale.value = withDelay(animationDuration, withTiming(
                Math.min(s, 3), { duration: animationDuration }
            ));
        }
    });

    const playerNameFontSize = calcPlayerFontSize(playerName.length) * .8;

    return (
        <Animated.View style={[animatedStyles, { justifyContent: 'center' }]}
            entering={FadeIn.duration(500).delay(100 + index * animationDuration)}
            /* layout={layoutAnimation} */
            onLayout={layoutHandler} >
            <Animated.Text style={[styles.name, { fontSize: playerNameFontSize, color: fontColor }]}
                /* layout={layoutAnimation} */
                numberOfLines={1} >
                {playerName}
            </Animated.Text>
            <Animated.View style={styles.scoreLineOne} >
                <ScoreBefore roundScore={roundScore} totalScore={totalScore}
                    fontColor={fontColor} />
                <ScoreRound roundScore={roundScore} totalScore={totalScore}
                    fontColor={fontColor} />
            </Animated.View>
            <ScoreAfter roundScore={roundScore} totalScore={totalScore}
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
