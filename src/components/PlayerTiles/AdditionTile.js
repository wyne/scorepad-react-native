import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import Animated, { FadeIn, StretchInY, withDecay, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Layout, Easing } from 'react-native-reanimated';
import { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';

const LineZero = ({ roundScore, totalScore, fontColor }) => {
    const d = totalScore - roundScore;

    return (
        <Animated.View entering={ZoomIn.delay(0).duration(100)} layout={Layout.easing(Easing.ease).delay(0).duration(100)}>
            <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[styles.totalScore, { color: fontColor + '75' }]}
            >
                {d}
            </Text>
        </Animated.View>
    );
};

const LineOne = ({ roundScore, totalScore, fontColor }) => {
    if (roundScore == 0) {
        return <></>;
    }
    const d = roundScore;

    return (
        <Animated.View entering={ZoomIn.delay(100).duration(100)} exiting={ZoomOut.delay(200).duration(100)} layout={Layout.easing(Easing.ease).delay(100).duration(100)}>
            <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[(roundScore == 0 ? styles.totalScore : styles.roundScore), { color: fontColor + '75' }]}
            >
                {roundScore > 0 && " + "}
                {d}
            </Text>
        </Animated.View>
    );
};

const LineTwo = ({ roundScore, totalScore, fontColor }) => {
    if (roundScore == 0) {
        return <></>;
    }

    return (
        <Animated.View entering={ZoomIn.delay(300).duration(100)} exiting={ZoomOut.delay(0).duration(100)}>
            <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[styles.totalScore, { color: fontColor }]}
            >
                ={totalScore}
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
            sharedScale.value = withSpring(Math.min(s, 3));
        }
    });

    const EualsItem = ({ children, hidden = false }) => {
        if (hidden) { return <></>; };

        return (
            <Animated.Text entering={FadeIn.delay(2000).duration(1000)} style={{ color: fontColor + '75' }}>
                {children}
            </Animated.Text>
        );
    };

    return (
        <Animated.View style={[animatedStyles, { justifyContent: 'center' }]} onLayout={layoutHandler} layout={Layout.easing(Easing.ease).delay(100).duration(100)}>
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
        fontSize: 35,
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
