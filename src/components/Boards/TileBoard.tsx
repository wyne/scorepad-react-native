import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Animated, LayoutChangeEvent, StyleSheet } from 'react-native';
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

interface GridTopology {
    rows: number;
    cols: number;
}

const GRID_FADE_OUT_MS = 70;
const GRID_FADE_IN_MS = 110;

const sameTopology = (first: GridTopology | null, second: GridTopology | null): boolean =>
    first != null && second != null && first.rows === second.rows && first.cols === second.cols;

const TileBoard: React.FC<TileBoardProps> = ({ showHint, foldSplit = null }) => {
    const theme = useTheme();
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const playerIds = useAppSelector(state => {
        const currentGameId = state.settings.currentGameId;
        return currentGameId ? selectGameById(state, currentGameId)?.playerIds : undefined;
    });
    const visiblePlayerIds = playerIds ?? [];
    const [boardSize, setBoardSize] = useState<BoardSize | null>(null);
    const [displayedTopology, setDisplayedTopology] = useState<GridTopology | null>(null);
    const displayedTopologyRef = useRef<GridTopology | null>(null);
    const pendingTopologyRef = useRef<GridTopology | null>(null);
    const gridOpacity = useRef(new Animated.Value(1)).current;
    const playerCount = visiblePlayerIds.length;

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
    // each target grid from one size snapshot, then reveal topology changes only
    // after the current grid has faded out.
    const targetGrid = useMemo(() => {
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

    const targetTopology = targetGrid == null
        ? null
        : { rows: targetGrid.rows, cols: targetGrid.cols };
    const targetTopologyKey = targetTopology == null
        ? null
        : `${targetTopology.rows}x${targetTopology.cols}`;
    pendingTopologyRef.current = targetTopology;

    useEffect(() => {
        let cancelled = false;
        let fadeInFrame: ReturnType<typeof requestAnimationFrame> | null = null;
        const currentTopology = displayedTopologyRef.current;
        const nextTopology = pendingTopologyRef.current;

        if (nextTopology == null) {
            displayedTopologyRef.current = null;
            setDisplayedTopology(null);
            gridOpacity.setValue(1);
            return;
        }

        if (currentTopology == null) {
            displayedTopologyRef.current = nextTopology;
            setDisplayedTopology(nextTopology);
            gridOpacity.setValue(1);
            return;
        }

        gridOpacity.stopAnimation();
        if (sameTopology(currentTopology, nextTopology)) {
            Animated.timing(gridOpacity, {
                duration: GRID_FADE_IN_MS,
                toValue: 1,
                useNativeDriver: true,
            }).start();
            return () => gridOpacity.stopAnimation();
        }

        Animated.timing(gridOpacity, {
            duration: GRID_FADE_OUT_MS,
            toValue: 0,
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (!finished || cancelled) return;

            // Use the latest pending topology: measurements that arrive during
            // the fade never become visible as intermediate grid arrangements.
            const latestTopology = pendingTopologyRef.current;
            if (latestTopology == null) return;

            displayedTopologyRef.current = latestTopology;
            setDisplayedTopology(latestTopology);
            fadeInFrame = requestAnimationFrame(() => {
                if (cancelled) return;
                Animated.timing(gridOpacity, {
                    duration: GRID_FADE_IN_MS,
                    toValue: 1,
                    useNativeDriver: true,
                }).start();
            });
        });

        return () => {
            cancelled = true;
            if (fadeInFrame != null) cancelAnimationFrame(fadeInFrame);
            gridOpacity.stopAnimation();
        };
    }, [gridOpacity, targetTopologyKey]);

    const grid = useMemo(() => {
        if (boardSize == null || targetGrid == null) return null;

        const topology = displayedTopology ?? targetGrid;
        return {
            ...topology,
            tileWidth: Math.round(boardSize.width / topology.cols),
            tileHeight: Math.round(boardSize.height / topology.rows),
        };
    }, [boardSize, displayedTopology, targetGrid]);

    if (visiblePlayerIds.length === 0) return null;

    return (
        // Docked on the left half, the board stops short of the vertical bar's
        // inset on the right.
        <SafeAreaView edges={foldSplit === 'columns' ? ['left'] : ['left', 'right']} style={
            [styles.contentStyle,
            {
                paddingBottom: foldSplit ? 0 : fullscreen ? 20 : bottomSheetHeight + 2, // Add 2 to account for the border
                backgroundColor: theme.background,
            }]
        } onLayout={layoutHandler} >
            {grid != null && (
                <Animated.View
                    style={[styles.tileGrid, { opacity: gridOpacity }]}
                    testID={`tile-grid-${grid.rows}x${grid.cols}`}
                >
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
                </Animated.View>
            )}
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
