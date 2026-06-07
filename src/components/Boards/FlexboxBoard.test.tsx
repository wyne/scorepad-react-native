import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../../redux/GamesSlice';
import playersReducer from '../../../redux/PlayersSlice';
import settingsReducer from '../../../redux/SettingsSlice';

// Mock the GameSheet import to avoid bottom sheet issues
jest.mock('../Sheets/GameSheet', () => ({
    bottomSheetHeight: 80,
}));

import FlexboxBoard from './FlexboxBoard';

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: ({ children, onLayout, style }: {
        children: React.ReactNode;
        onLayout?: (event: { nativeEvent: { layout: { width: number; height: number } } }) => void;
        style?: object;
    }) => {
        const { View } = jest.requireActual('react-native');
        return <View onLayout={onLayout} style={style} testID="safe-area-view">{children}</View>;
    },
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
    const View = jest.requireActual('react-native').View;
    
    return {
        __esModule: true,
        default: {
            View: View,
        },
        FadeIn: {
            delay: jest.fn(() => ({ duration: jest.fn(() => ({ easing: jest.fn() })) })),
        },
        Easing: {
            ease: jest.fn(),
        },
    };
});

// Mock FlexboxTile component
jest.mock('./FlexboxTile', () => {
    return function MockFlexboxTile({ playerId, cols, rows, width, height, index }: {
        playerId: string;
        cols: number;
        rows: number;
        width: number;
        height: number;
        index: number;
    }) {
        const { View, Text } = jest.requireActual('react-native');
        return (
            <View testID={`flexbox-tile-${playerId}`}>
                <Text>Player: {playerId}</Text>
                <Text>Cols: {cols}</Text>
                <Text>Rows: {rows}</Text>
                <Text>Width: {width}</Text>
                <Text>Height: {height}</Text>
                <Text>Index: {index}</Text>
            </View>
        );
    };
});

const createMockStore = (initialState: Parameters<typeof configureStore>[0]['preloadedState']) => {
    return configureStore({
        reducer: {
            settings: settingsReducer,
            games: gamesReducer,
            players: playersReducer,
        },
        preloadedState: initialState,
    });
};

describe('FlexboxBoard', () => {
    const mockGame = {
        id: 'game-1',
        title: 'Test Game',
        dateCreated: Date.now(),
        roundCurrent: 1,
        roundTotal: 3,
        playerIds: ['player-1', 'player-2', 'player-3', 'player-4'],
    };

    const mockPlayers = {
        'player-1': {
            id: 'player-1',
            playerName: 'Player 1',
            scores: [10, 15],
        },
        'player-2': {
            id: 'player-2',
            playerName: 'Player 2',
            scores: [5, 20],
        },
        'player-3': {
            id: 'player-3',
            playerName: 'Player 3',
            scores: [8, 12],
        },
        'player-4': {
            id: 'player-4',
            playerName: 'Player 4',
            scores: [15, 8],
        },
    };

    it('should render null when no players are available', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': {
                        ...mockGame,
                        playerIds: [],
                    },
                },
                ids: ['game-1'],
            },
            players: {
                entities: {},
                ids: [],
            },
        });

        const { toJSON } = render(
            <Provider store={store}>
                <FlexboxBoard showHint={false} />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render null when playerIds is null', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': {
                        ...mockGame,
                        playerIds: undefined,
                    },
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { toJSON } = render(
            <Provider store={store}>
                <FlexboxBoard showHint={false} />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render safe area view when players are available', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': mockGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2', 'player-3', 'player-4'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <FlexboxBoard showHint={false} />
            </Provider>
        );

        expect(getByTestId('safe-area-view')).toBeTruthy();
    });

    it('should not render tiles before layout is calculated', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': mockGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2', 'player-3', 'player-4'],
            },
        });

        const { queryByTestId } = render(
            <Provider store={store}>
                <FlexboxBoard showHint={false} />
            </Provider>
        );

        // Before layout event, no tiles should be rendered
        expect(queryByTestId('flexbox-tile-player-1')).toBeNull();
    });

    it('should render tiles after layout event with calculated grid', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': mockGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2', 'player-3', 'player-4'],
            },
        });

        const { getByTestId, getAllByText } = render(
            <Provider store={store}>
                <FlexboxBoard showHint={false} />
            </Provider>
        );

        const safeAreaView = getByTestId('safe-area-view');
        
        // Trigger layout event with specific dimensions
        fireEvent(safeAreaView, 'layout', {
            nativeEvent: {
                layout: {
                    width: 400,
                    height: 600,
                },
            },
        });

        // After layout, tiles should be rendered
        expect(getByTestId('flexbox-tile-player-1')).toBeTruthy();
        expect(getByTestId('flexbox-tile-player-2')).toBeTruthy();
        expect(getByTestId('flexbox-tile-player-3')).toBeTruthy();
        expect(getByTestId('flexbox-tile-player-4')).toBeTruthy();

        // Check that grid calculations are passed to tiles
        expect(getAllByText('Cols: 2')).toHaveLength(4); // 4 players in 2x2 grid
        expect(getAllByText('Rows: 2')).toHaveLength(4);
    });

    it('should calculate correct tile dimensions', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': mockGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2', 'player-3', 'player-4'],
            },
        });

        const { getByTestId, getAllByText } = render(
            <Provider store={store}>
                <FlexboxBoard showHint={false} />
            </Provider>
        );

        const safeAreaView = getByTestId('safe-area-view');
        
        // Trigger layout with 400x600 dimensions
        fireEvent(safeAreaView, 'layout', {
            nativeEvent: {
                layout: {
                    width: 400,
                    height: 600,
                },
            },
        });

        // For 2x2 grid: width = 400/2 = 200, height = 600/2 = 300
        expect(getAllByText('Width: 200')).toHaveLength(4);
        expect(getAllByText('Height: 300')).toHaveLength(4);
    });

    it('should handle different player counts and calculate optimal grid', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': {
                        ...mockGame,
                        playerIds: ['player-1', 'player-2', 'player-3'], // 3 players
                    },
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2', 'player-3'],
            },
        });

        const { getByTestId, getAllByText } = render(
            <Provider store={store}>
                <FlexboxBoard showHint={false} />
            </Provider>
        );

        const safeAreaView = getByTestId('safe-area-view');
        
        // Trigger layout event
        fireEvent(safeAreaView, 'layout', {
            nativeEvent: {
                layout: {
                    width: 300,
                    height: 400,
                },
            },
        });

        // For 3 players, should calculate optimal grid (likely 3x1 or 1x3)
        expect(getByTestId('flexbox-tile-player-1')).toBeTruthy();
        expect(getByTestId('flexbox-tile-player-2')).toBeTruthy();
        expect(getByTestId('flexbox-tile-player-3')).toBeTruthy();

        // Check that all tiles have the same grid configuration
        const colsTexts = getAllByText(/Cols: \d+/);
        const rowsTexts = getAllByText(/Rows: \d+/);
        expect(colsTexts).toHaveLength(3);
        expect(rowsTexts).toHaveLength(3);
    });

    it('should handle single player', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': {
                        ...mockGame,
                        playerIds: ['player-1'],
                    },
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1'],
            },
        });

        const { getByTestId, getByText } = render(
            <Provider store={store}>
                <FlexboxBoard showHint={false} />
            </Provider>
        );

        const safeAreaView = getByTestId('safe-area-view');
        
        fireEvent(safeAreaView, 'layout', {
            nativeEvent: {
                layout: {
                    width: 300,
                    height: 400,
                },
            },
        });

        expect(getByTestId('flexbox-tile-player-1')).toBeTruthy();
        // Single player should be 1x1 grid
        expect(getByText('Cols: 1')).toBeTruthy();
        expect(getByText('Rows: 1')).toBeTruthy();
        expect(getByText('Width: 300')).toBeTruthy();
        expect(getByText('Height: 400')).toBeTruthy();
    });

    it('should adjust padding for bottom sheet', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': mockGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <FlexboxBoard showHint={false} />
            </Provider>
        );

        const safeAreaView = getByTestId('safe-area-view');
        expect(safeAreaView.props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    paddingBottom: 82, // bottomSheetHeight (80) + 2
                }),
            ])
        );
    });

    it('should pass correct index to each tile', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': mockGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2', 'player-3', 'player-4'],
            },
        });

        const { getByTestId, getByText } = render(
            <Provider store={store}>
                <FlexboxBoard showHint={false} />
            </Provider>
        );

        const safeAreaView = getByTestId('safe-area-view');
        
        fireEvent(safeAreaView, 'layout', {
            nativeEvent: {
                layout: {
                    width: 400,
                    height: 400,
                },
            },
        });

        // Check that each tile has the correct index
        expect(getByText('Index: 0')).toBeTruthy(); // player-1
        expect(getByText('Index: 1')).toBeTruthy(); // player-2
        expect(getByText('Index: 2')).toBeTruthy(); // player-3
        expect(getByText('Index: 3')).toBeTruthy(); // player-4
    });

    it('should handle layout changes after initial render', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': {
                        ...mockGame,
                        playerIds: ['player-1', 'player-2'],
                    },
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId, getAllByText } = render(
            <Provider store={store}>
                <FlexboxBoard showHint={false} />
            </Provider>
        );

        const safeAreaView = getByTestId('safe-area-view');
        
        // Initial layout
        fireEvent(safeAreaView, 'layout', {
            nativeEvent: {
                layout: {
                    width: 200,
                    height: 400,
                },
            },
        });

        // Should initially have certain dimensions (1x2 grid: width=200/1=200, height=400/2=200)
        expect(getAllByText('Width: 200')).toHaveLength(2);

        // Change layout dimensions
        fireEvent(safeAreaView, 'layout', {
            nativeEvent: {
                layout: {
                    width: 400,
                    height: 200,
                },
            },
        });

        // Should recalculate and update dimensions (2x1 grid: width=400/2=200, height=200/1=200)
        expect(getAllByText('Width: 200')).toHaveLength(2);
    });
});
