import React, { memo, useCallback, useMemo, useState } from 'react';

import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { selectGameById } from '../../../redux/GamesSlice';
import { useAppSelector } from '../../../redux/hooks';
import { bottomSheetHeight } from '../../components/Sheets/GameSheet';
import type { GameFoldSplit } from '../../hooks/useExpandedGameLayout';
import { useTheme } from '../../theme';

import PlayerTile from './PlayerTile';

interface TileBoardProps {
    showHint: boolean;
    foldSplit?: GameFoldSplit | null;
}

interface BoardSize {
    width: number;
    height: number;
}

const TileBoard: React.FC<TileBoardProps> = ({ showHint, foldSplit = null }) => {
    const theme = useTheme();
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const playerIds = useAppSelector(state => {
        const currentGameId = state.settings.currentGameId;
        return currentGameId ? selectGameById(state, currentGameId)?.playerIds : undefined;
    });
    const visiblePlayerIds = playerIds ?? [];
    const [boardSize, setBoardSize] = useState<BoardSize | null>(null);
    const playerCount = visiblePlayerIds.length;
    const paddingBottom = foldSplit ? 0 : fullscreen ? 20 : bottomSheetHeight + 2;

    const layoutHandler = useCallback((e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        const nextSize = { width: Math.round(width), height: Math.round(height) };

        setBoardSize(currentSize =>
            currentSize?.width === nextSize.width && currentSize.height === nextSize.height
                ? currentSize
                : nextSize
        );
    }, []);

    // The old layout path stored width, height, rows, and columns independently,
    // then recalculated once with stale dimensions and again in an effect. Derive
    // the complete grid from one content-size snapshot, after safe-area and
    // bottom-sheet padding, so tile geometry matches the space it actually fills.
    const grid = useMemo(() => {
        if (boardSize == null || playerCount === 0) return null;

        let closestAspectRatio = Number.MAX_SAFE_INTEGER;
        let bestRowCount = 1;

        for (let rows = 1; rows <= playerCount; rows++) {
            const cols = Math.ceil(playerCount / rows);

            if (playerCount % rows > 0 && rows - playerCount % rows > 1) {
                continue;
            }

            const w = boardSize.width / cols;
            const h = boardSize.height / rows;
            const ratio = w / h;

            if (Math.abs(1 - ratio) < Math.abs(1 - closestAspectRatio)) {
                closestAspectRatio = ratio;
                bestRowCount = rows;
            }
        }

        const rows = bestRowCount;
        const cols = Math.ceil(playerCount / rows);
        return {
            rows,
            cols,
            tileWidth: Math.round(boardSize.width / cols),
            tileHeight: Math.round(boardSize.height / rows),
        };
    }, [boardSize, playerCount]);

    if (visiblePlayerIds.length === 0) return null;

    return (
        // Docked on the left half, the board stops short of the vertical bar's
        // inset on the right.
        <SafeAreaView edges={foldSplit === 'columns' ? ['left'] : ['left', 'right']} style={
            [styles.contentStyle,
            {
                paddingBottom,
                backgroundColor: theme.background,
            }]
        } >
            <View style={styles.contentStyle} onLayout={layoutHandler} testID="tile-board-viewport">
                {grid != null && (
                    <View style={styles.tileGrid} testID={`tile-grid-${grid.rows}x${grid.cols}`}>
                        {visiblePlayerIds.map((id, index) => (
                            <PlayerTile
                                key={id}
                                playerId={id}
                                cols={grid.cols}
                                rows={grid.rows}
                                width={grid.tileWidth}
                                height={grid.tileHeight}
                                index={index}
                                showHint={showHint}
                            />
                        ))}
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    contentStyle: {
        flex: 1,
        maxWidth: '100%',
    },
    tileGrid: {
        alignContent: 'stretch',
        flex: 1,
        flexDirection: 'row',
        flexGrow: 1,
        flexWrap: 'wrap',
        maxWidth: '100%',
    },
});

export default memo(TileBoard);
