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
    const [rows, setRows] = useState<number>(1);
    const [cols, setCols] = useState<number>(1);
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const currentGame = useAppSelector(state => selectGameById(state, state.settings.currentGameId));

    const [width, setWidth] = useState<number | null>(null);
    const [height, setHeight] = useState<number | null>(null);

    if (currentGame == undefined) return null;

    const playerIds = currentGame.playerIds;

    const desiredAspectRatio = 0.8;

    let timeoutId: NodeJS.Timeout | null = null;

    const layoutHandler = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            setWidth(Math.round(width));
            setHeight(Math.round(height));

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

            setRows(bestRowCount);
            setCols(Math.ceil(playerIds.length / bestRowCount));
        }, 10);
    };

    type DimensionValue = (index: number, total: number, rows: number, cols: number) => {
        width: number;
        height: number;
    }

    const calculateDimensions: DimensionValue = (index: number, total: number, rows: number, cols: number) => {
        if (width == null || height == null) return { width: 0, height: 0 };
        const h = height / rows;
        // calculate width based on number of rows
        // but if the index is in the last row, use the remainder
        let w;
        if (total % rows > 0 && index >= total - total % rows) {
            w = width / (total % rows);
        } else {
            w = width / cols;
        }

        return {
            width: Math.round(w),
            height: Math.round(h)
        };
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={[StyleSheet.absoluteFillObject]}>
                <View style={styles.contentStyle} onLayout={layoutHandler} >
                    {playerIds.map((id, index) => (
                        width != null && height != null &&
                        <PlayerTile
                            key={id}
                            playerId={id}
                            color={'#' + palette[index % palette.length]}
                            fontColor={getContrastRatio('#' + palette[index % palette.length], '#000').number > 7 ? "#000000" : "#FFFFFF"}
                            cols={(rows != 0 && cols != 0) ? cols : 0}
                            rows={(rows != 0 && cols != 0) ? rows : 0}
                            width={calculateDimensions(index, playerIds.length, rows, cols).width}
                            height={calculateDimensions(index, playerIds.length, rows, cols).height}
                            index={index}
                        />
                    ))}
                </View>

                <Rounds navigation={navigation} show={!fullscreen} />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
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
