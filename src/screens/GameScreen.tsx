import React, { useCallback, useEffect, useState } from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getContrastRatio } from 'colorsheet';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { selectGameById } from '../../redux/GamesSlice';
import { useAppSelector } from '../../redux/hooks';
import PlayerTile from '../components/PlayerTile';
import AddendModal from '../components/Sheets/AddendModal';
import GameSheet, { bottomSheetHeight } from '../components/Sheets/GameSheet';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ScoreBoardScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    if (typeof currentGameId == 'undefined') return null;

    const palette = ["01497c", "c25858", "f5c800", "275436", "dc902c", "62516a", "755647", "925561"];
    const [rows, setRows] = useState<number>(0);
    const [cols, setCols] = useState<number>(0);
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const currentGame = useAppSelector(state => selectGameById(state, state.settings.currentGameId));

    const [width, setWidth] = useState<number | null>(null);
    const [height, setHeight] = useState<number | null>(null);

    if (currentGame == undefined) return null;

    const playerIds = currentGame.playerIds;

    const playerCount = playerIds.length;

    const desiredAspectRatio = 0.8;

    const layoutHandler = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;

        setWidth(Math.round(width));
        setHeight(Math.round(height));
        calcGrid();
    };

    const calcGrid = () => {
        let closestAspectRatio = Number.MAX_SAFE_INTEGER;
        let bestRowCount = 1;

        if (width == null || height == null) return;

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
    };

    useEffect(() => {
        if (width == null || height == null) return;
        calcGrid();
    }, [playerCount, width, height]);

    type DimensionValue = (rows: number, cols: number) => {
        width: number;
        height: number;
    }

    const calculateTileDimensions: DimensionValue = (rows: number, cols: number) => {
        if (width == null || height == null) return { width: 0, height: 0 };

        const dims = {
            width: Math.round(width / cols),
            height: Math.round(height / rows)
        };

        return dims;
    };

    const [windowHeight, setWindowHeight] = useState<number>(0);

    const onLayout = useCallback((event: LayoutChangeEvent) => {
        const { height } = event.nativeEvent.layout;
        setWindowHeight(height);
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <View style={[StyleSheet.absoluteFillObject]} onLayout={onLayout}>
                <SafeAreaView edges={['left', 'right']} style={
                    [styles.contentStyle,
                    {
                        paddingBottom: fullscreen ? 20 : bottomSheetHeight + 2, // Add 2 to account for the border
                    }]
                } onLayout={layoutHandler} >
                    {playerIds.map((id, index) => (
                        width != null && height != null && rows != 0 && cols != 0 &&
                        <PlayerTile
                            key={id}
                            playerId={id}
                            color={'#' + palette[index % palette.length]}
                            fontColor={getContrastRatio('#' + palette[index % palette.length], '#000').number > 7 ? "#000000" : "#FFFFFF"}
                            cols={cols}
                            rows={rows}
                            width={calculateTileDimensions(rows, cols).width}
                            height={calculateTileDimensions(rows, cols).height}
                            index={index}
                        />
                    ))}
                </SafeAreaView>
                {!fullscreen &&
                    <GameSheet navigation={navigation} containerHeight={windowHeight} />
                }
                <AddendModal />
            </View>
        </View>
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
        backgroundColor: '#000000',
    },
    contentContainer: {
        flex: 1,
    },
});

export default ScoreBoardScreen;
