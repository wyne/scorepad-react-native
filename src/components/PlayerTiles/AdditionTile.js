import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { Layout, Easing } from 'react-native-reanimated';
import {
    useSharedValue,
    useAnimatedStyle,
    withTiming
} from 'react-native-reanimated';

const animationDuration = 100;
const animationEnabled = true;
const enteringAnimation = animationEnabled ? ZoomIn.duration(animationDuration) : null;
const exitingAnimation = animationEnabled ? ZoomOut.duration(animationDuration) : null;
const layoutAnimation = animationEnabled ? Layout.easing(Easing.ease).duration(animationDuration) : null;

const calcFontSize = (length) => {
    if (length <= 3) {
        return 50;
    } else if (length <= 4) {
        return 40;
    } else if (length <= 5) {
        return 40;
    } else if (length <= 6) {
        return 46;
    } else if (length <= 7) {
        return 43;
    } else if (length <= 8) {
        return 40;
    } else if (length <= 8) {
        return 37;
    } else {
        return 34;
    }
};

const calcScoreLengthRatio = (length) => {
    if (length <= 3) {
        return .8;
    } else if (length <= 4) {
        return .6;
    } else if (length <= 5) {
        return .5;
    } else {
        return .3;
    }
};


const ScoreBefore = ({ roundScore, totalScore, fontColor }) => {
    const firstRowLength = (roundScore == 0 ? 0 : roundScore.toString().length + 3) + totalScore.toString().length;
    const d = totalScore - roundScore;

    const fontSize = useSharedValue(calcFontSize(firstRowLength));
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
            calcFontSize(firstRowLength), { duration: animationDuration }
        );
        fontOpacity.value = withTiming(
            roundScore == 0 ? 100 : 75, { duration: animationDuration }
        );
    }, [roundScore]);

    return (
        <Animated.View entering={enteringAnimation}>
            <Animated.Text
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
    const firstRowLength = (roundScore == 0 ? 0 : roundScore.toString().length + 3) + totalScore.toString().length;
    const fontSizeRound = useSharedValue(calcFontSize(firstRowLength));
    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: fontSizeRound.value,
        };
    });

    const d = roundScore;

    useEffect(() => {
        fontSizeRound.value = withTiming(
            calcFontSize(firstRowLength), { duration: animationDuration }
        );
    }, [roundScore]);

    if (roundScore == 0) {
        return <></>;
    }

    return (
        <Animated.View entering={enteringAnimation}>
            <Animated.Text numberOfLines={1}
                style={[animatedStyles, {
                    fontVariant: ['tabular-nums'],
                    color: fontColor, opacity: .75
                }]}>
                {roundScore > 0 && " + "}
                {roundScore < 0 && " - "}
                {Math.abs(d)}
            </Animated.Text>
        </Animated.View>
    );
};

const ScoreAfter = ({ roundScore, totalScore, fontColor }) => {
    if (roundScore == 0) {
        return <></>;
    }

    const fontSize = useSharedValue(calcFontSize(totalScore.toString().length));

    const animatedStyles = useAnimatedStyle(() => {
        return {
            fontSize: fontSize.value,
        };
    });

    useEffect(() => {
        fontSize.value = withTiming(
            calcFontSize(totalScore.toString().length), { duration: animationDuration }
        );
    }, [roundScore]);

    return (
        <Animated.View entering={enteringAnimation} exiting={exitingAnimation}>
            <Animated.Text
                style={[animatedStyles, styles.scoreTotal, { color: fontColor }]}>
                {totalScore}
            </Animated.Text>
        </Animated.View>
    );
};

const AdditionTile = ({
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

    const layoutHandler = (e) => {
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
            sharedScale.value = withTiming(
                Math.min(s, 3), { duration: animationDuration }
            );
        }
    });

    const playerNameFontSize = calcFontSize(playerName.length) * .8;

    return (
        <Animated.View style={[animatedStyles, { justifyContent: 'center' }]}
            entering={FadeIn.duration(500).delay(100 + index * animationDuration)}
            layout={layoutAnimation}
            onLayout={layoutHandler} >
            <Animated.Text style={[styles.name, { fontSize: playerNameFontSize, color: fontColor }]}
                numberOfLines={1}
                layout={layoutAnimation}
            >
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
    scoreTotal: {
        fontVariant: ['tabular-nums'],
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default AdditionTile;
