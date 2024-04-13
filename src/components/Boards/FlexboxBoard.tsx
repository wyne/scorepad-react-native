import React, { useEffect, useState } from 'react';

import { getContrastRatio } from 'colorsheet';
import { LayoutChangeEvent, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppSelector } from '../../../redux/hooks';
import { selectCurrentGame } from '../../../redux/selectors';
import { bottomSheetHeight } from '../../components/Sheets/GameSheet';

import FlexboxTile from './FlexboxTile';

interface FlexboxBoardProps {
    // define your props here
}

const FlexboxBoard: React.FC<FlexboxBoardProps> = () => {
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const playerIds = useAppSelector(state => selectCurrentGame(state)?.playerIds);

    if (playerIds == null || playerIds.length == 0) return null;

    const palette = ["01497c", "c25858", "f5c800", "275436", "dc902c", "62516a", "755647", "925561"];
    const [rows, setRows] = useState<number>(0);
    const [cols, setCols] = useState<number>(0);

    const [width, setWidth] = useState<number | null>(null);
    const [height, setHeight] = useState<number | null>(null);

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
    };

    const calculateTileDimensions: DimensionValue = (rows: number, cols: number) => {
        if (width == null || height == null) return { width: 0, height: 0 };

        const dims = {
            width: Math.round(width / cols),
            height: Math.round(height / rows)
        };

        return dims;
    };

    return (
        <SafeAreaView edges={['left', 'right']} style={
            [styles.contentStyle,
            {
                paddingBottom: fullscreen ? 20 : bottomSheetHeight + 2, // Add 2 to account for the border
            }]
        } onLayout={layoutHandler} >
            {playerIds.map((id, index) => (
                width != null && height != null && rows != 0 && cols != 0 &&
                <FlexboxTile
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

export default FlexboxBoard;
