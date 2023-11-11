import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import Animated, {
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
    const sharedOpacity = useSharedValue(0);

    const animatedStyles = useAnimatedStyle(() => {
        return {
            // transform: [{ scale: sharedScale.value }],
            opacity: sharedOpacity.value,
        };
    });

    const layoutHandler = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
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

        sharedOpacity.value = withDelay(100 + index * animationDuration / 2, withTiming(
            1, { duration: animationDuration * 2 }
        ));
    });

    console.log("AdditionTile maxWidth=", maxWidth);
    const playerNameFontSize = calcPlayerFontSize(maxWidth, playerName.length) * .8;

    return (
        <Animated.View style={[animatedStyles, { justifyContent: 'center' }]}
            onLayout={layoutHandler}>
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
