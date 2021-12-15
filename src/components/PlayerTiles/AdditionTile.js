import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, TouchableHighlight } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { s, vs, ms, mvs } from 'react-native-size-matters';

const PlayerScore = ({ playerName, totalScore, roundScore, fontColor, maxWidth, maxHeight }) => {
    const [scale, setScale] = useState(1);
    const [w, setW] = useState(0);
    const [h, setH] = useState(0);

    const layoutHandler = (e) => {
        const { x, y, width, height } = e.nativeEvent.layout;
        setH(height);
        setW(width);
    }
    useEffect(() => {
        const s = maxWidth / w;
        if (s > 0 && s < 100) {
            setScale(s);
        }
    })


    return (
        <View style={{ padding: 10, transform: [{ scale: scale }] }} onLayout={layoutHandler}>
            <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Text numberOfLines={1} style={[styles.name, { color: fontColor }]}>
                    {playerName}
                </Text>
            </View>
            <View>
                {roundScore != 0 &&
                    <Text numberOfLines={1}
                        style={[styles.roundScore, { color: fontColor + '75', fontSize: 35 },]}>
                        {roundScore > 0 && "+"} {roundScore}
                    </Text>
                }
                <Text style={[styles.totalScore, { fontSize: 55, lineHeight: 55, color: fontColor }]}>
                    {roundScore != 0 && <Text style={[styles.label, styles.totalLabel, { color: fontColor + '75' }]}>=</Text>}
                    {totalScore}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    playerCard: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    surface: {
        position: 'absolute',
        width: '100%',
        borderColor: 'red',
    },
    surfaceAdd: {
        top: 0,
        bottom: '50%',
    },
    surfaceSubtract: {
        top: '50%',
        bottom: 0,
    },
    name: {
        color: 'white',
        fontSize: 50,
        fontWeight: 'bold',
        textAlign: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    },
    roundScore: {
        marginTop: 10,
        textAlign: 'center',
        color: 'white',
        fontVariant: ['tabular-nums'],
    },
    roundBox: {
        // padding: 5,
        padding: 10,
        borderRadius: 5,
        borderWidth: 2,
        alignSelf: 'center'
    },
    totalScore: {
        fontVariant: ['tabular-nums'],
        fontWeight: 'bold',
        alignSelf: 'center',
        margin: 0,
        marginTop: 0,
        padding: 0,
    },
    label: {
        textAlign: 'center',
        alignSelf: 'center',
        color: 'white',
    },
    totalLabel: {
        fontVariant: ['tabular-nums'],
        alignSelf: 'center',
        textAlign: 'center',
    },
});

export default PlayerScore;