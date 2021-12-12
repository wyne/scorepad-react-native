import React, { useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import PlayerScore from '../components/PlayerScore'
import Rounds from '../components/Rounds';
import { useSelector } from 'react-redux';
import { getContrastRatio } from 'colorsheet';

export default function ScoreBoardScreen({ navigation }) {
    const palette = ["01497c", "c25858", "f5c800", "275436", "dc902c", "62516a", "755647", "925561"]

    const [grid, setGrid] = useState({ rows: 0, cols: 0 });
    const players = useSelector(state => state.currentGame.players);

    const desiredAspectRatio = 1.0 / 1.0;

    const onLayout = (e) => {
        var { x, y, width, height } = e.nativeEvent.layout;

        let diff = 99;
        let idealRows = 1;
        for (let rows = 1; rows <= players.length; rows++) {
            const cols = Math.ceil(players.length / rows);

            //TODO: skip if too imbalanced
            if (players.length % rows > 0 && rows - players.length % rows > 1) {
                console.log("skipped", players.length % rows, rows);
                continue;
            }

            const w = width / cols;
            let h = height / rows;

            const ratio = w / h;

            console.log(rows, 'x', cols, '=', ratio);

            if (Math.abs(desiredAspectRatio - ratio) < diff) {
                diff = Math.abs(desiredAspectRatio - ratio);
                idealRows = rows;
            }
        }

        console.log("Best: ", idealRows, 'x', Math.ceil(players.length / idealRows));
        setGrid({ rows: idealRows, cols: Math.ceil(players.length / idealRows) })
    }

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

