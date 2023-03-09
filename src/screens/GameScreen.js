import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { getContrastRatio } from 'colorsheet';

import PlayerTile from '../components/PlayerTile'
import Rounds from '../components/Rounds';
import { selectGameById } from '../../redux/GamesSlice';

export default function ScoreBoardScreen({ navigation }) {
    const palette = ["01497c", "c25858", "f5c800", "275436", "dc902c", "62516a", "755647", "925561"]

    const [grid, setGrid] = useState({ rows: 0, cols: 0 });
    const fullscreen = useSelector(state => state.settings.home_fullscreen);

    // New
    const currentGame = useSelector(state => selectGameById(state, state.currentGame.uuid));
    const playerIds = currentGame.scoreIds;

    const desiredAspectRatio = 0.8;

    const layoutHandler = (e) => {
        var { x, y, width, height } = e.nativeEvent.layout;

        let closestAspectRatio = Number.MAX_SAFE_INTEGER
        let bestRowCount = 1;

        for (let rows = 1; rows <= playerIds.length; rows++) {
            const cols = Math.ceil(playerIds.length / rows);

            if (playerIds.length % rows > 0 && rows - playerIds.length % rows > 1) {
                continue;
            }

            const w = width / cols;
            const h = height / rows;
            const ratio = w / h;

            if (Math.abs(desiredAspectRatio - ratio) < Math.abs(desiredAspectRatio - closestAspectRatio)) {
                closestAspectRatio = ratio;
                bestRowCount = rows;
            }
        }

        setGrid({ rows: bestRowCount, cols: Math.ceil(playerIds.length / bestRowCount) })
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.appContainer}>
                <View style={styles.contentStyle} onLayout={layoutHandler} >
                    {playerIds.map((id, index) => (
                        <PlayerTile
                            key={id}
                            playerId={id}
                            color={'#' + palette[index % palette.length]}
                            fontColor={getContrastRatio('#' + palette[index % palette.length], '#000').number > 7 ? "#000000" : "#FFFFFF"}
                            cols={(grid.rows != 0 && grid.cols != 0) ? grid.cols : 0}
                            rows={(grid.rows != 0 && grid.cols != 0) ? grid.rows : 0}
                        />
                    ))}
                </View>

                <Rounds style={styles.footerStyle} navigation={navigation} show={!fullscreen} />
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
        flexDirection: 'row',
        maxWidth: '100%',
        backgroundColor: '#000000'
    },
    footerStyle: {
        flex: 1,
    }
});

