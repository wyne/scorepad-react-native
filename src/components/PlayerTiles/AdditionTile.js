import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Animated, { FadeIn, StretchInY, withDecay, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Layout, Easing } from 'react-native-reanimated';
import { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const LineZero = ({ roundScore, totalScore, fontColor }) => {
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
        fontSize.value = withTiming(roundScore == 0 ? 55 : 30, { duration: 100 });
        fontOpacity.value = withTiming(roundScore == 0 ? 100 : 75, { duration: 100 });
    }, [roundScore]);

    return (
        <Animated.View entering={ZoomIn.delay(0).duration(100)}>
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

const LineOne = ({ roundScore, totalScore, fontColor }) => {
    if (roundScore == 0) {
        return <></>;
    }
    const d = roundScore;

    return (
        <Animated.View entering={ZoomIn.delay(0).duration(100)} >
            <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={{ fontVariant: ['tabular-nums'], color: fontColor, opacity: .75, fontSize: 30 }}
            >
                {roundScore > 0 && " + "}
                {roundScore < 0 && " - "}
                {Math.abs(d)}
            </Text>
        </Animated.View>
    );
};

const LineTwo = ({ roundScore, totalScore, fontColor }) => {
    if (roundScore == 0) {
        return <></>;
    }

    return (
        <Animated.View entering={ZoomIn.delay(0).duration(100)} exiting={ZoomOut.delay(0).duration(200)}>
            <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[styles.totalScore, { color: fontColor }]}
            >
                {totalScore}
            </Text>
        </Animated.View>
    );
};

const AdditionTile = ({ playerName, totalScore, roundScore, fontColor, maxWidth, maxHeight }) => {
    const [delayedTotalScore, setDelayedTotalScore] = useState(totalScore);
    const [scale, setScale] = useState(1);
    const [w, setW] = useState(0);
    const [h, setH] = useState(0);

    const sharedScale = useSharedValue(1);

    const animatedStyles = useAnimatedStyle(() => {
        return {
            transform: [{ scale: sharedScale.value }],
        };
    });

    useEffect(() => {
        setTimeout(() => {
            setDelayedTotalScore(totalScore);
        }, 300);
    }, [totalScore]);

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
            setScale(Math.min(s, 3));
            sharedScale.value = withTiming(Math.min(s, 3), { duration: 100 });
        }
    });

    return (
        <Animated.View style={[animatedStyles, { justifyContent: 'center' }]} onLayout={layoutHandler} layout={Layout.easing(Easing.ease).delay(0).duration(100)}>
            <Animated.Text
                layout={Layout.easing(Easing.ease).delay(0).duration(100)}
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[styles.name, { color: fontColor }]}
            >
                {playerName}
            </Animated.Text>

            <Animated.View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }} >
                <LineZero roundScore={roundScore} totalScore={totalScore} fontColor={fontColor} />
                <LineOne roundScore={roundScore} totalScore={totalScore} fontColor={fontColor} />
            </Animated.View>
            <LineTwo roundScore={roundScore} totalScore={totalScore} fontColor={fontColor} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    name: {
        fontSize: 50,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    roundScore: {
        fontSize: 30,
        fontVariant: ['tabular-nums'],
        marginTop: 10,
        textAlign: 'center',
    },
    totalScore: {
        fontSize: 55,
        fontVariant: ['tabular-nums'],
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default AdditionTile;
