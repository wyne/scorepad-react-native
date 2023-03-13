import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';

const AdditionTile = ({ playerName, totalScore, roundScore, fontColor, maxWidth, maxHeight }) => {
    const [scale, setScale] = useState(1);
    const [w, setW] = useState(0);
    const [h, setH] = useState(0);

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
        }
    });

    const PlayerNameItem = ({ children }) => {
        return (
            <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[styles.name, { color: fontColor }]}
            >
                {children}
            </Text>
        );
    };

    const RoundScoreItem = ({ children, hidden = false }) => {
        if (hidden) { return <></>; };

        return (
            <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[styles.roundScore, { color: fontColor + '75' }]}
            >
                {children}
            </Text>
        );
    };

    const EualsItem = ({ children, hidden = false }) => {
        if (hidden) { return <></>; };

        return (
            <Text style={{ color: fontColor + '75' }}>
                {children}
            </Text>
        );
    };

    const TotalScoreItem = ({ children }) => {
        return (
            <Text
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[styles.totalScore, { color: fontColor }]}
            >
                {children}
            </Text>
        );
    };

    return (
        <View style={{ justifyContent: 'center', transform: [{ scale: scale }] }} onLayout={layoutHandler}>
            <PlayerNameItem>
                {playerName}
            </PlayerNameItem>

            <RoundScoreItem hidden={roundScore == 0}>
                {roundScore > 0 && "+ "}
                {roundScore < 0 && "- "}
                {Math.abs(roundScore)}
            </RoundScoreItem>

            <TotalScoreItem>
                <EualsItem hidden={roundScore == 0}>
                    =
                </EualsItem>
                {totalScore}
            </TotalScoreItem>
        </View>
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
