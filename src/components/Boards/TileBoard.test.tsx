import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Provider } from 'react-redux';

import gamesReducer, { updateGame } from '../../../redux/GamesSlice';
import playersReducer from '../../../redux/PlayersSlice';
import settingsReducer from '../../../redux/SettingsSlice';

import TileBoard from './TileBoard';

jest.mock('../Sheets/GameSheet', () => ({ bottomSheetHeight: 80 }));

let mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => mockInsets,
}));

const mockPlayerTileRender = jest.fn();
const mockPlayerTileMount = jest.fn();
const mockPlayerTileUnmount = jest.fn();
jest.mock('./PlayerTile', () => {
    return function MockPlayerTile({ playerId, cols, rows, width, height, index }: {
        playerId: string; cols: number; rows: number; width: number; height: number; index: number;
    }) {
        const { useEffect } = jest.requireActual('react');
        const { View, Text } = jest.requireActual('react-native');
        mockPlayerTileRender();
        useEffect(() => {
            mockPlayerTileMount();
            return () => mockPlayerTileUnmount();
        }, []);
        return (
            <View testID={`player-tile-${playerId}`}>
                <Text>Cols: {cols}</Text>
                <Text>Rows: {rows}</Text>
                <Text>Width: {width}</Text>
                <Text>Height: {height}</Text>
                <Text>Index: {index}</Text>
            </View>
        );
    };
});

const createMockStore = (initialState: Parameters<typeof configureStore>[0]['preloadedState']) => configureStore({
    reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
    preloadedState: initialState,
});

describe('TileBoard', () => {
    const playerIds = ['player-1', 'player-2', 'player-3', 'player-4'];
    const mockGame = {
        id: 'game-1', title: 'Test Game', dateCreated: 0, roundCurrent: 1, roundTotal: 3, playerIds,
    };
    const players = Object.fromEntries(playerIds.map(id => [id, { id, playerName: id, scores: [10, 15] }]));

    const renderBoard = ({
        ids = playerIds,
        size = { width: 400, height: 600 },
        fullscreen = false,
        foldSplit = null,
    }: {
        ids?: string[];
        size?: { width: number; height: number };
        fullscreen?: boolean;
        foldSplit?: 'columns' | 'rows' | null;
    } = {}) => {
        const store = createMockStore({
            settings: { currentGameId: 'game-1', home_fullscreen: fullscreen },
            games: { entities: { 'game-1': { ...mockGame, playerIds: ids } }, ids: ['game-1'] },
            players: { entities: players, ids: playerIds },
        });
        const element = (nextSize = size, nextSplit = foldSplit) => (
            <Provider store={store}>
                <TileBoard boardSize={nextSize} showHint={false} foldSplit={nextSplit} />
            </Provider>
        );
        return { ...render(element()), store, element };
    };

    beforeEach(() => {
        mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
        mockPlayerTileRender.mockClear();
        mockPlayerTileMount.mockClear();
        mockPlayerTileUnmount.mockClear();
    });

    it('renders nothing when no players are available', () => {
        expect(renderBoard({ ids: [] }).toJSON()).toBeNull();
    });

    it('renders players immediately when they become available after an empty state', () => {
        const { store, getByTestId, toJSON } = renderBoard({ ids: [] });
        expect(toJSON()).toBeNull();
        act(() => store.dispatch(updateGame({ id: 'game-1', changes: { playerIds: ['player-1'] } })));
        expect(getByTestId('player-tile-player-1')).toBeTruthy();
    });

    it('renders safely when playerIds is undefined', () => {
        const { store, toJSON } = renderBoard();
        act(() => store.dispatch(updateGame({ id: 'game-1', changes: { playerIds: undefined } })));
        expect(toJSON()).toBeNull();
    });

    it('renders the complete grid on the first render without waiting for a native layout event', () => {
        const { getByTestId, getAllByText } = renderBoard();
        expect(getByTestId('tile-grid-2x2')).toBeTruthy();
        expect(getAllByText('Width: 200')).toHaveLength(4);
        expect(getAllByText('Height: 300')).toHaveLength(4);
        expect(getByTestId('tile-board-viewport').props.onLayout).toBeUndefined();
        expect(mockPlayerTileRender).toHaveBeenCalledTimes(4);
    });

    it('uses the same inset snapshot for native padding and tile geometry', () => {
        mockInsets = { top: 0, bottom: 0, left: 12, right: 28 };
        const { getByTestId, getAllByText } = renderBoard({ size: { width: 440, height: 600 } });
        expect(StyleSheet.flatten(getByTestId('tile-board').props.style)).toMatchObject({
            paddingLeft: 12, paddingRight: 28,
        });
        expect(getAllByText('Width: 200')).toHaveLength(4);
        expect(getAllByText('Height: 300')).toHaveLength(4);
    });

    it('leaves room for the game sheet to the board size it is given', () => {
        const { getByTestId, getAllByText } = renderBoard({ size: { width: 400, height: 600 } });
        expect(StyleSheet.flatten(getByTestId('tile-board').props.style).paddingBottom).toBeUndefined();
        expect(getAllByText('Height: 300')).toHaveLength(4);
    });

    it('uses only the left inset in a column split', () => {
        mockInsets = { top: 0, bottom: 0, left: 12, right: 28 };
        const { getByTestId, getAllByText } = renderBoard({
            foldSplit: 'columns', size: { width: 412, height: 600 },
        });
        expect(StyleSheet.flatten(getByTestId('tile-board').props.style)).toMatchObject({
            paddingLeft: 12, paddingRight: 0,
        });
        expect(getAllByText('Width: 200')).toHaveLength(4);
        expect(getAllByText('Height: 300')).toHaveLength(4);
    });

    it('keeps both side insets in a row split', () => {
        mockInsets = { top: 0, bottom: 0, left: 12, right: 28 };
        const { getAllByText } = renderBoard({ foldSplit: 'rows', size: { width: 440, height: 600 } });
        expect(getAllByText('Width: 200')).toHaveLength(4);
        expect(getAllByText('Height: 300')).toHaveLength(4);
    });

    it('handles one player and preserves each player index', () => {
        const single = renderBoard({ ids: ['player-1'] });
        expect(single.getByTestId('tile-grid-1x1')).toBeTruthy();
        expect(single.getByText('Width: 400')).toBeTruthy();
        expect(single.getByText('Height: 600')).toBeTruthy();
        single.unmount();
        const all = renderBoard();
        for (let index = 0; index < playerIds.length; index++) expect(all.getByText(`Index: ${index}`)).toBeTruthy();
    });

    it('keeps a consistent grid for an incomplete final row', () => {
        const { getAllByText } = renderBoard({ ids: playerIds.slice(0, 3) });
        expect(getAllByText('Cols: 2')).toHaveLength(3);
        expect(getAllByText('Rows: 2')).toHaveLength(3);
    });

    it('commits new grid and text bounds in one render without remounting any tile', () => {
        const { getByTestId, getAllByText, rerender, element } = renderBoard({
            ids: ['player-1', 'player-2'], size: { width: 200, height: 400 },
        });
        expect(getByTestId('tile-grid-2x1')).toBeTruthy();
        mockPlayerTileRender.mockClear();

        const nextSize = { width: 400, height: 200 };
        rerender(element(nextSize));

        expect(getByTestId('tile-grid-1x2')).toBeTruthy();
        expect(getAllByText('Width: 200')).toHaveLength(2);
        expect(getAllByText('Height: 200')).toHaveLength(2);
        expect(mockPlayerTileRender).toHaveBeenCalledTimes(2);
        expect(mockPlayerTileMount).toHaveBeenCalledTimes(2);
        expect(mockPlayerTileUnmount).not.toHaveBeenCalled();

        mockPlayerTileRender.mockClear();
        rerender(element(nextSize));
        expect(mockPlayerTileRender).not.toHaveBeenCalled();
    });

    it('does not render invalid tile bounds in a collapsed viewport', () => {
        const { queryByTestId } = renderBoard({ size: { width: 0, height: 0 } });
        expect(queryByTestId('player-tile-player-1')).toBeNull();
    });
});
