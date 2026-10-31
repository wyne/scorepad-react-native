import React, { memo, useMemo } from 'react';

import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDisplayCornerRadius } from '../../../modules/display-corners';
import { selectGameById } from '../../../redux/GamesSlice';
import { useAppSelector } from '../../../redux/hooks';
import { useVerticalBarLayout, type GameFoldSplit } from '../../hooks/useExpandedGameLayout';
import { useTheme } from '../../theme';

import PlayerTile, { TILE_BORDER, TILE_RADIUS } from './PlayerTile';

interface TileBoardProps {
    boardSize: BoardSize;
    // Where the board's top left corner sits in the window, so tiles in a
    // screen corner can follow the display's curve.
    boardOrigin?: { x: number; y: number };
    showHint: boolean;
    foldSplit?: GameFoldSplit | null;
}

interface BoardSize {
    width: number;
    height: number;
}

const TileBoard: React.FC<TileBoardProps> = ({ boardSize, boardOrigin = { x: 0, y: 0 }, showHint, foldSplit = null }) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const window = useWindowDimensions();
    const displayRadius = useDisplayCornerRadius();
    // On the iPhone Duo the tiles run to the screen's edges, so match the
    // margin around the board to the gap between tiles.
    const edgeInset = useVerticalBarLayout() ? TILE_BORDER : 0;
    const playerIds = useAppSelector(state => {
        const currentGameId = state.settings.currentGameId;
        return currentGameId ? selectGameById(state, currentGameId)?.playerIds : undefined;
    });
    const visiblePlayerIds = playerIds ?? [];
    const playerCount = visiblePlayerIds.length;
    const paddingRight = foldSplit === 'columns' ? 0 : insets.right;
    const contentWidth = Math.max(0, boardSize.width - insets.left - paddingRight - edgeInset * 2);
    // The space for the collapsed game sheet is already outside `boardSize`
    // (see GameScreen), so folding animates it with the board's frame.
    const contentHeight = Math.max(0, boardSize.height - edgeInset * 2);

    // Insets, grid geometry, and text bounds use the same render snapshot.
    // Native safe-area padding and onLayout-driven grid state otherwise resize
    // the board first, then the tiles, then their text in separate commits.
    const grid = useMemo(() => {
        if (!(contentWidth > 0 && contentHeight > 0) || playerCount === 0) return null;

        let closestAspectRatio = Number.MAX_SAFE_INTEGER;
        let bestRowCount = 1;

        for (let rows = 1; rows <= playerCount; rows++) {
            const cols = Math.ceil(playerCount / rows);

            if (playerCount % rows > 0 && rows - playerCount % rows > 1) {
                continue;
            }

            const w = contentWidth / cols;
            const h = contentHeight / rows;
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
            tileWidth: contentWidth / cols,
            tileHeight: contentHeight / rows,
        };
    }, [contentWidth, contentHeight, playerCount]);

    // Tile corners that sit in a screen corner follow its curve: concentric
    // with the display, so the radius shrinks by the tile's distance from the
    // screen's edges. Every other corner keeps the usual radius.
    const cornerRadii = useMemo(() => {
        if (grid == null) return [];

        const originX = boardOrigin.x + insets.left + edgeInset;
        const originY = boardOrigin.y + edgeInset;
        const lastRowCount = playerCount - (grid.rows - 1) * grid.cols;
        const concentric = (...distances: number[]) =>
            Math.max(TILE_RADIUS, displayRadius - Math.max(...distances));

        return Array.from({ length: playerCount }, (_, index) => {
            const row = Math.floor(index / grid.cols);
            const col = index % grid.cols;
            // A short last row stretches its tiles to fill the width.
            const width = row === grid.rows - 1 ? contentWidth / lastRowCount : grid.tileWidth;
            const left = originX + col * width;
            const top = originY + row * grid.tileHeight;
            const right = window.width - (left + width);
            const bottom = window.height - (top + grid.tileHeight);

            return {
                topLeft: concentric(left, top),
                topRight: concentric(right, top),
                bottomLeft: concentric(left, bottom),
                bottomRight: concentric(right, bottom),
            };
        });
    }, [grid, boardOrigin.x, boardOrigin.y, insets.left, edgeInset, playerCount, contentWidth, window.width, window.height, displayRadius]);

    if (visiblePlayerIds.length === 0) return null;

    return (
        // Docked on the left half, the board stops short of the vertical bar's
        // inset on the right.
        <View testID="tile-board" style={
            [styles.contentStyle,
            {
                paddingLeft: insets.left,
                paddingRight,
                backgroundColor: theme.background,
            }]
        } >
            <View style={{ width: contentWidth, height: contentHeight, margin: edgeInset }} testID="tile-board-viewport">
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
                                radiusTopLeft={cornerRadii[index]?.topLeft}
                                radiusTopRight={cornerRadii[index]?.topRight}
                                radiusBottomLeft={cornerRadii[index]?.bottomLeft}
                                radiusBottomRight={cornerRadii[index]?.bottomRight}
                                showHint={showHint}
                            />
                        ))}
                    </View>
                )}
            </View>
        </View>
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
