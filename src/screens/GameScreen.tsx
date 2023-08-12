import React, { useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getContrastRatio } from 'colorsheet';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';

import { useAppSelector } from '../../redux/hooks';
import PlayerTile from '../components/PlayerTile';
import Rounds from '../components/Rounds';
import { selectGameById } from '../../redux/GamesSlice';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ScoreBoardScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    if (typeof currentGameId == 'undefined') return null;

    const palette = ["01497c", "c25858", "f5c800", "275436", "dc902c", "62516a", "755647", "925561"];
    const [grid, setGrid] = useState({ rows: 0, cols: 0 });
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const currentGame = useAppSelector(state => selectGameById(state, state.settings.currentGameId));

    if (currentGame == undefined) return null;

    const playerIds = currentGame.playerIds;

    const desiredAspectRatio = 0.8;

    const layoutHandler = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;

        let closestAspectRatio = Number.MAX_SAFE_INTEGER;
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

        setGrid({ rows: bestRowCount, cols: Math.ceil(playerIds.length / bestRowCount) });
    };

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
                            index={index}
                        />
                    ))}
                </View>

                <Rounds navigation={navigation} show={!fullscreen} />
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
    }
});

export default ScoreBoardScreen;