import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Layout, Easing } from 'react-native-reanimated';
import {
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';

const animationDuration = 100;

const ScoreBefore = ({ roundScore, totalScore, fontColor }) => {
    const d = totalScore - roundScore;
    const fontSize = useSharedValue(55);
    const fontOpacity = useSharedValue(100);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: fontSize.value,
            fontWeight: roundScore == 0 ? 'bold' : 'normal',
            opacity: fontOpacity.value / 100,
        };
    });

    useEffect(() => {
        fontSize.value = withTiming(
            roundScore == 0 ? 55 : 30, { duration: animationDuration }
        );
        fontOpacity.value = withTiming(
            roundScore == 0 ? 100 : 75, { duration: animationDuration }
        );
    }, [roundScore]);

    return (
        <Animated.View entering={ZoomIn.delay(0).duration(animationDuration)}>
            <Animated.Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[animatedStyles, {
                    fontVariant: ['tabular-nums'],
                    color: fontColor,
                }]} >
                {d}
            </Animated.Text>
        </Animated.View>
    );
};

const ScoreRound = ({ roundScore, totalScore, fontColor }) => {
    if (roundScore == 0) {
        return <></>;
    }
    const d = roundScore;

    return (
        <Animated.View entering={ZoomIn.delay(0).duration(animationDuration)}>
            <Text adjustsFontSizeToFit numberOfLines={1}
                style={{
                    fontVariant: ['tabular-nums'],
                    color: fontColor, opacity: .75, fontSize: 30
                }} >
                {roundScore > 0 && " + "}
                {roundScore < 0 && " - "}
                {Math.abs(d)}
            </Text>
        </Animated.View>
    );
};

const ScoreAfter = ({ roundScore, totalScore, fontColor }) => {
    if (roundScore == 0) {
        return <></>;
    }

    return (
        <Animated.View entering={ZoomIn.duration(animationDuration)}
            exiting={ZoomOut.delay(0).duration(200)}>
            <Text adjustsFontSizeToFit numberOfLines={1}
                style={[styles.scoreTotal, { color: fontColor }]}>
                {totalScore}
            </Text>
        </Animated.View>
    );
};

const AdditionTile = ({ playerName, totalScore, roundScore, fontColor, maxWidth, maxHeight, index }) => {
    const [w, setW] = useState(1);
    const [h, setH] = useState(1);

    const sharedScale = useSharedValue(1);

    const animatedStyles = useAnimatedStyle(() => {
        return {
            transform: [{ scale: sharedScale.value }],
        };
    });

    const layoutHandler = (e) => {
        const { x, y, width, height } = e.nativeEvent.layout;
        setH(height);
        setW(width);
    };

    useEffect(() => {
        const hs = maxWidth / w;
        const vs = maxHeight / h;
        if (Math.min(hs, vs) > 0) {
            const s = Math.min(.7 * hs, .7 * vs);
            sharedScale.value = withTiming(
                Math.min(s, 3), { duration: animationDuration }
            );
        }
    });

    return (
        <Animated.View style={[animatedStyles, { justifyContent: 'center' }]}
            entering={FadeIn.duration(500).delay(500 + index * animationDuration)}
            layout={Layout.easing(Easing.ease).duration(animationDuration)}
            onLayout={layoutHandler} >
            <Animated.Text style={[styles.name, { color: fontColor }]}
                adjustsFontSizeToFit numberOfLines={1}
                layout={Layout.easing(Easing.ease).duration(animationDuration)}>
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
        fontSize: 50,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    scoreLineOne: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreTotal: {
        fontSize: 55,
        fontVariant: ['tabular-nums'],
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default AdditionTile;
