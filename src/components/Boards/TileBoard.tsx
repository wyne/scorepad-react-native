import React, { memo, useMemo } from 'react';

import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { selectGameById } from '../../../redux/GamesSlice';
import { useAppSelector } from '../../../redux/hooks';
import type { GameFoldSplit } from '../../hooks/useExpandedGameLayout';
import { useTheme } from '../../theme';

import PlayerTile from './PlayerTile';

interface TileBoardProps {
    boardSize: BoardSize;
    showHint: boolean;
    foldSplit?: GameFoldSplit | null;
}

interface BoardSize {
    width: number;
    height: number;
}

const TileBoard: React.FC<TileBoardProps> = ({ boardSize, showHint, foldSplit = null }) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const playerIds = useAppSelector(state => {
        const currentGameId = state.settings.currentGameId;
        return currentGameId ? selectGameById(state, currentGameId)?.playerIds : undefined;
    });
    const visiblePlayerIds = playerIds ?? [];
    const playerCount = visiblePlayerIds.length;
    const paddingRight = foldSplit === 'columns' ? 0 : insets.right;
    const contentWidth = Math.max(0, boardSize.width - insets.left - paddingRight);
    // The space for the collapsed game sheet is already outside `boardSize`
    // (see GameScreen), so folding animates it with the board's frame.
    const contentHeight = Math.max(0, boardSize.height);

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
            <View style={{ width: contentWidth, height: contentHeight }} testID="tile-board-viewport">
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
