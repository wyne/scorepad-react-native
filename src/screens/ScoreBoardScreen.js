import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, SliderComponent, Button, Dimensions } from 'react-native';
import PlayerScore from '../components/PlayerScore'
import Rounds from '../components/Rounds';
import { useDispatch, useSelector } from 'react-redux';
import { resetCardData } from '../../redux/CurrentGameActions';

// export default class ScoreBoardScreen extends React.Component {
export default function ScoreBoardScreen({ navigation, children }) {
    const [grid, setGrid] = useState({ rows: null, cols: null });
    const [cols, setCols] = useState(0);
    const [rows, setRows] = useState(0);

    const palette = ["01497c", "c25858", "f5c800", "275436"]
    const fontPalette = ["FFFFFF", "FFFFFF", "000000", "FFFFFF"]

    const players = useSelector(state => state.currentGame.players);
    const cardDatas = useSelector(state => state.currentGame.cards);

    const dispatch = useDispatch();

    const resize = (src) => {
        const fn = (src) => {
            if (Object.keys(cardDatas || {}).length >= players.length) {
                const lefts = getLefts();
                const newCols = [...new Set(lefts)].length;
                const newRows = Math.ceil(players.length / newCols);
                if (newRows != grid.rows || newCols != grid.cols) {
                    setGrid({ rows: newRows, cols: newCols })
                }
                // dispatch(resetCardData());
            }
        }
        setTimeout(fn, 100, src);
        // fn(src);
    }

    useEffect(() => {
        // resize("effect [ grid.rows, grid.cols ] =>")
        console.log("use effect grid", grid)
    }, [grid])

    useEffect(() => {
        // resize("effect [ grid.rows, grid.cols ] =>")
        console.log("use effect []", grid)
    }, [])

    const handleResetRows = (src) => {
        console.log("set grid zeros")
        setGrid({ rows: 0, cols: 0 })
        // dispatch(resetCardData());
    }

    const handleResetCards = (src) => {
        dispatch(resetCardData());
        const lefts = getLefts();
        console.log("reset card data", lefts)
    }

    const handleEval = (src) => {
        const lefts = getLefts();
        console.log("eval", lefts)
        resize(src)
    }

    const handleTest = (src) => {
        const lefts = getLefts();
        console.log("test", lefts)
        // resize(src)
    }

    const getLefts = () => {
        if (cardDatas === undefined) return []
        const d = players.map((name, index) => {
            return (cardDatas[index] || {}).x
        })
        return d.filter(i => i !== undefined);
    }


    const onLayout = (e) => {
        const lefts = getLefts();
        console.log("onLayout", lefts);
        handleResetRows("layout");
        handleResetCards("layout");
        // handleEval("layout");
    }

    const pFn = () => {
        console.log("pFn", grid)
    }

    useEffect(() => {
        const lefts = getLefts();
        const newCols = [...new Set(lefts)].length;
        const newRows = Math.ceil(players.length / newCols);
        if (newRows != grid.rows || newCols != grid.cols) {
            console.log("cardDatas", lefts)
            if (lefts.length == players.length) {
                console.log("EVAL NOW!!!")
                resize("useEffect no args")
            }
        } else {
            console.log("same")
        }
    })

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
                        cols={(grid.rows != null && grid.cols != null) ? grid.cols : 0}
                        rows={(grid.rows != null && grid.cols != null) ? grid.rows : 0}
                        parentFn={pFn}
                    />
                ))}
            </View>
            <View style={{ flexDirection: 'row' }}>
                <Button onPress={handleResetRows} title="reset rows"></Button>
                <Button onPress={handleEval} title="eval"></Button>
                <Button onPress={handleTest} title="test"></Button>
                <Button onPress={handleResetCards} title="reset card data"></Button>
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
        backgroundColor: '#000000'
    },
    footerStyle: {
        flex: 1,
    }
});

