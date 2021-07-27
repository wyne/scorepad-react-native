import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, } from 'react-native';
import PlayerScore from '../components/PlayerScore'
import Rounds from '../components/Rounds';
import { useDispatch, useSelector } from 'react-redux';

export default function ScoreBoardScreen({ navigation }) {
    const [cols, setCols] = useState(0);
    const palette = ["01497c", "c25858", "f5c800", "275436"]
    const fontPalette = ["FFFFFF", "FFFFFF", "000000", "FFFFFF"]

    const players = useSelector(state => state.currentGame.players);
    const cardDatas = useSelector(state => state.currentGame.cards);

    const resize = () => {
        if (Object.keys(cardDatas || {}).length >= players.length) {
            const lefts = players.map((name, index) => { return (cardDatas[index] || {}).x })
            console.log("lefts", lefts)
            const columns = [...new Set(lefts)].length
            setCols(columns);
        } else {
            console.log("NOPE")
        }
    }
    useEffect(() => {
        console.log("effect")
        resize()
    }, [players])

    const onLayout = () => {
        console.log("layout")
        resize()
    }

    console.log("columns", cols)

    return (
        <View style={styles.appContainer}>
            <View
                style={styles.contentStyle}
                onLayout={onLayout}
            >
                {players.map((name, index) => (
                    <PlayerScore
                        key={index}
                        playerIndex={index}
                        color={palette[index % palette.length]}
                        fontColor={fontPalette[index % palette.length]}
                        cols={cols}
                        parentFn={onLayout}
                    />
                ))}
            </View>
            <Rounds
                style={styles.footerStyle}
                navigation={navigation}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    appContainer: {
        // paddingTop: Constants.statusBarHeight,
        // height: Platform.OS === 'web' ? '100vh' : '100%',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        position: 'absolute',
    },
    contentStyle: {
        flex: 1,
        flexGrow: 1,
        flexWrap: 'wrap',
        alignContent: 'stretch',
        flexDirection: 'column',
        maxWidth: '100%',
    },
    footerStyle: {
        flex: 1,
    }
});

