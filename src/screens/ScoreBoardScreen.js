import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PlayerScore from '../components/PlayerScore'
import Rounds from '../components/Rounds';
import { useDispatch, useSelector } from 'react-redux';
import { resetCardData } from '../../redux/CurrentGameActions';
import { getContrastRatio } from 'colorsheet';

export default function ScoreBoardScreen({ navigation }) {
    const palette = ["01497c", "c25858", "f5c800", "275436", "dc902c", "62516a", "755647", "925561"]

    const [grid, setGrid] = useState({ rows: 0, cols: 0 });
    const players = useSelector(state => state.currentGame.players);
    const cardDatas = useSelector(state => state.currentGame.cards);
    const dispatch = useDispatch();

    const resize = () => {
        const fn = () => {
            if (Object.keys(cardDatas || {}).length >= players.length) {
                const newCols = countColumns();
                const newRows = Math.ceil(players.length / newCols);
                if (newRows != grid.rows || newCols != grid.cols) {
                    setGrid({ rows: newRows, cols: newCols })
                }
            }
        }
        // Todo: this delay is necessary unfortunately.
        setTimeout(fn, 100);
    }

    const countColumns = () => {
        if (cardDatas === undefined) return []
        const d = players.map((name, index) => {
            return (cardDatas[index] || {}).x
        })
        const lefts = d.filter(i => i !== undefined);
        return [...new Set(lefts)].length;
    }

    const handleResetRows = () => {
        setGrid({ rows: 0, cols: 0 })
    }

    const handleResetCards = () => {
        dispatch(resetCardData());
    }

    const handleEval = () => {
        resize()
    }

    const onLayout = (e) => {
        handleResetRows();
        handleResetCards();
    }

    useEffect(() => {
        resize();
    })

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.appContainer}>
                <View style={styles.contentStyle} onLayout={onLayout} >
                    {players.map((name, index) => (
                        <PlayerScore
                            key={index}
                            playerIndex={index}
                            color={'#' + palette[index % palette.length]}
                            fontColor={getContrastRatio('#' + palette[index % palette.length], '#000').number > 7 ? "black" : "white"}
                            cols={(grid.rows != 0 && grid.cols != 0) ? grid.cols : 0}
                            rows={(grid.rows != 0 && grid.cols != 0) ? grid.rows : 0}
                        />
                    ))}
                </View>

                {false && <View style={{ flexDirection: 'row' }}>
                    <Button onPress={handleResetRows} title="reset rows"></Button>
                    <Button onPress={handleEval} title="eval"></Button>
                    <Button onPress={handleResetCards} title="reset card data"></Button>
                </View>}

                <Rounds style={styles.footerStyle} navigation={navigation} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    appContainer: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        position: 'absolute',
        // display: 'none',
    },
    contentStyle: {
        flex: 1,
        flexGrow: 1,
        flexWrap: 'wrap',
        alignContent: 'stretch',
        flexDirection: 'column',
        maxWidth: '100%',
        backgroundColor: '#000000'
    },
    footerStyle: {
        flex: 1,
    }
});

