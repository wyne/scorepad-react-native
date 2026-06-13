import React, { memo, useState } from 'react';

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

    if (playerIds == null || playerIds.length == 0) return null;

    const playerCount = playerIds.length;
    const [layoutState, setLayoutState] = useState<TileBoardLayoutState>({
        layout: null,
        measurementCount: 0,
    });

    const layoutHandler = (e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        const layout = calculateTileBoardLayout(playerCount, Math.round(width), Math.round(height));

        setLayoutState((previous) => ({
            layout,
            measurementCount: previous.measurementCount + 1,
        }));
    };

    const { layout, measurementCount } = layoutState;
    const layoutReady = measurementCount > 1;
    const tileDimensions = layout == null
        ? null
        : calculateTileDimensions(layout);

    return (
        <SafeAreaView edges={['left', 'right']} style={
            [styles.contentStyle,
            {
                paddingBottom: fullscreen ? 20 : bottomSheetHeight + 2, // Add 2 to account for the border
                backgroundColor: theme.background,
            }]
        } onLayout={layoutHandler} >
            {playerIds.map((id, index) => (
                layoutReady && layout != null && tileDimensions != null &&
                <PlayerTile
                    key={id}
                    playerId={id}
                    cols={layout.cols}
                    rows={layout.rows}
                    width={tileDimensions.width}
                    height={tileDimensions.height}
                    index={index}
                    showHint={showHint}
                />
            ))}
        </SafeAreaView>
    );
};

interface TileBoardLayout {
    cols: number;
    height: number;
    rows: number;
    width: number;
}

interface TileBoardLayoutState {
    layout: TileBoardLayout | null;
    measurementCount: number;
}

const desiredAspectRatio = 1;

export const calculateTileBoardLayout = (playerCount: number, width: number, height: number): TileBoardLayout => {
    let closestAspectRatio = Number.MAX_SAFE_INTEGER;
    let bestRowCount = 1;

    for (let rows = 1; rows <= playerCount; rows++) {
        const cols = Math.ceil(playerCount / rows);

        if (playerCount % rows > 0 && rows - playerCount % rows > 1) {
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

    return {
        cols: Math.ceil(playerCount / bestRowCount),
        height,
        rows: bestRowCount,
        width,
    };
};

export const calculateTileDimensions = (layout: TileBoardLayout) => {
    return {
        height: Math.round(layout.height / layout.rows),
        width: Math.round(layout.width / layout.cols),
    };
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
