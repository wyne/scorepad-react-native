import React, { memo, useEffect, useState } from 'react';

import { LayoutChangeEvent, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { selectGameById } from '../../../redux/GamesSlice';
import { useAppSelector } from '../../../redux/hooks';
import { bottomSheetHeight } from '../../components/Sheets/GameSheet';
import { useTheme } from '../../theme';

import PlayerTile from './PlayerTile';

const TileBoard: React.FC<{ showHint: boolean }> = ({ showHint }) => {
    const theme = useTheme();
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const playerIds = useAppSelector(state => {
        const currentGameId = state.settings.currentGameId;
        return currentGameId ? selectGameById(state, currentGameId)?.playerIds : undefined;
    });
    const visiblePlayerIds = playerIds ?? [];

    const [rows, setRows] = useState<number>(0);
    const [cols, setCols] = useState<number>(0);

    const [width, setWidth] = useState<number | null>(null);
    const [height, setHeight] = useState<number | null>(null);

    const playerCount = visiblePlayerIds.length;

    const desiredAspectRatio = 1;

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

        for (let rows = 1; rows <= visiblePlayerIds.length; rows++) {
            const cols = Math.ceil(visiblePlayerIds.length / rows);

            if (visiblePlayerIds.length % rows > 0 && rows - visiblePlayerIds.length % rows > 1) {
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
        setCols(Math.ceil(visiblePlayerIds.length / bestRowCount));
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

    if (visiblePlayerIds.length === 0) return null;

    return (
        <SafeAreaView edges={['left', 'right']} style={
            [styles.contentStyle,
            {
                paddingBottom: fullscreen ? 20 : bottomSheetHeight + 2, // Add 2 to account for the border
                backgroundColor: theme.background,
            }]
        } onLayout={layoutHandler} >
            {visiblePlayerIds.map((id, index) => (
                width != null && height != null && rows != 0 && cols != 0 &&
                <PlayerTile
                    key={id}
                    playerId={id}
                    cols={cols}
                    rows={rows}
                    width={calculateTileDimensions(rows, cols).width}
                    height={calculateTileDimensions(rows, cols).height}
                    index={index}
                    showHint={showHint}
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
    },
    contentContainer: {
        flex: 1,
    },
});

export default memo(TileBoard);
