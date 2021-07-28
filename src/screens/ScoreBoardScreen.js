import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, SliderComponent, Button, } from 'react-native';
import PlayerScore from '../components/PlayerScore'
import Rounds from '../components/Rounds';
import { useDispatch, useSelector } from 'react-redux';

// export default class ScoreBoardScreen extends React.Component {
export default function ScoreBoardScreen({ navigation, children }) {
    const [grid, setGrid] = useState({ rows: null, cols: null });
    const [cols, setCols] = useState(0);
    const [rows, setRows] = useState(0);

    const palette = ["01497c", "c25858", "f5c800", "275436"]
    const fontPalette = ["FFFFFF", "FFFFFF", "000000", "FFFFFF"]

    const players = useSelector(state => state.currentGame.players);
    const cardDatas = useSelector(state => state.currentGame.cards);

    const resize = (src) => {
        const fn = (src) => {
            if (Object.keys(cardDatas || {}).length >= players.length) {
                const lefts = players.map((name, index) => { return (cardDatas[index] || {}).x })
                console.log("lefts", lefts)
                const newCols = [...new Set(lefts)].length;
                const newRows = Math.ceil(players.length / newCols);
                console.log(src, "resizing: set rows, cols", newRows, newCols);
                if (newRows != grid.rows || newCols != grid.cols) {
                    setGrid({ rows: newRows, cols: newCols })
                }
                // setCols(newCols);
                // setRows(newRows);
            } else {
                console.log(src, "resizing, but invalid cardDatas")
            }
        }
        setTimeout(fn, 0, src);
    }
    // console.log("rows, rols", rows, cols)
    useEffect(() => {
        // resize("effect [ grid.rows, grid.cols ] =>")
    }, [grid.rows, grid.cols])

    useEffect(() => {
        // resize("effect [ grid ] =>")
    }, [grid])

    useEffect(() => {
        // resize("effect [ players ] =>")
    }, [players])

    useEffect(() => {
        // resize("effect [ ] =>")
    }, [])

    useEffect(() => {
        // resize("effect no arg =>")
    })

    const handleReset = (src) => {
        setGrid({ rows: 0, cols: 0 })
        console.log(src, "set grid zeros")
    }

    const handleEval = (src) => {
        resize(src)
    }

    const onLayout = (e) => {
        // let lefts = [];
        // console.log("nativeEvent", JSON.stringify(e.nativeEvent))
        // console.log("childnodes", e.nativeEvent.target.childNodes)
        // for (let node of e.nativeEvent.target.childNodes) {
        //     lefts = lefts.concat(node.offsetLeft)
        // }
        // console.log("lefts", lefts);
        // const newCols = [...new Set(lefts)].length;
        // const newRows = Math.ceil(players.length / newCols);
        // if (newRows != grid.rows || newCols != grid.cols) {
        //     setGrid({ rows: newRows, cols: newCols })
        //     console.log("resizing: set rows, cols", newRows, newCols);
        // }
        // resize("parent layout =>")
        handleReset("layout");
        handleEval("layout");
    }

    const pFn = () => {
        // resize("child layout =>");
    }

    // console.log("component render, grid:", grid)

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
                <Button onPress={handleReset} title="reset"></Button>
                <Button onPress={handleEval} title="eval"></Button>
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

