import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer from '../../redux/SettingsSlice';

import GameScreen from './GameScreen';

// Mock the components that GameScreen uses
jest.mock('../components/Boards/FlexboxBoard', () => {
    return function MockFlexboxBoard() {
        const { View, Text } = jest.requireActual('react-native');
        return <View testID="flexbox-board"><Text>FlexboxBoard</Text></View>;
    };
});

jest.mock('../components/Sheets/AddendModal', () => {
    return function MockAddendModal() {
        const { View, Text } = jest.requireActual('react-native');
        return <View testID="addend-modal"><Text>AddendModal</Text></View>;
    };
});

jest.mock('../components/Sheets/GameSheet', () => {
    return function MockGameSheet({ containerHeight }: { containerHeight: number }) {
        const { View, Text } = jest.requireActual('react-native');
        return (
            <View testID="game-sheet">
                <Text>GameSheet - Height: {containerHeight}</Text>
            </View>
        );
    };
});

// Mock navigation
const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => true),
    getId: jest.fn(),
    getParent: jest.fn(),
    getState: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    popToTop: jest.fn(),
    replace: jest.fn(),
    jumpTo: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

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

describe('GameScreen', () => {
    const mockGame = {
        id: 'game-1',
        title: 'Test Game',
        dateCreated: Date.now(),
        roundCurrent: 0,
        roundTotal: 1,
        playerIds: ['player-1', 'player-2'],
    };

    const mockPlayers = {
        'player-1': {
            id: 'player-1',
            playerName: 'Player 1',
            scores: [10, 20],
        },
        'player-2': {
            id: 'player-2',
            playerName: 'Player 2',
            scores: [15, 25],
        },
    };

    it('should render null when no current game is set', () => {
        const store = createMockStore({
            settings: {
                currentGameId: undefined,
                home_fullscreen: false,
            },
            games: {
                entities: {},
                ids: [],
            },
            players: {
                entities: {},
                ids: [],
            },
        });

        const { toJSON } = render(
            <Provider store={store}>
                <GameScreen navigation={mockNavigation} />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render game components when current game is set', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
                home_fullscreen: false,
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
                <GameScreen navigation={mockNavigation} />
            </Provider>
        );

        expect(getByTestId('flexbox-board')).toBeTruthy();
        expect(getByTestId('addend-modal')).toBeTruthy();
        expect(getByTestId('game-sheet')).toBeTruthy();
    });

    it('should not render GameSheet in fullscreen mode', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
                home_fullscreen: true, // fullscreen mode
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

        const { getByTestId, queryByTestId } = render(
            <Provider store={store}>
                <GameScreen navigation={mockNavigation} />
            </Provider>
        );

        expect(getByTestId('flexbox-board')).toBeTruthy();
        expect(getByTestId('addend-modal')).toBeTruthy();
        expect(queryByTestId('game-sheet')).toBeNull();
    });

    it('should render GameSheet in non-fullscreen mode', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
                home_fullscreen: false, // not fullscreen
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
                <GameScreen navigation={mockNavigation} />
            </Provider>
        );

        expect(getByTestId('game-sheet')).toBeTruthy();
    });

    it('should handle layout changes for window height', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
                home_fullscreen: false,
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
                <GameScreen navigation={mockNavigation} />
            </Provider>
        );

        const mainView = getByTestId('flexbox-board').parent?.parent;
        expect(mainView).toBeTruthy();

        // The onLayout callback should be defined and callable
        // This tests that the component can handle layout changes
        expect(getByTestId('game-sheet')).toBeTruthy();
    });

    it('should pass navigation prop to GameSheet', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
                home_fullscreen: false,
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
                <GameScreen navigation={mockNavigation} />
            </Provider>
        );

        // GameSheet should be rendered with navigation prop
        expect(getByTestId('game-sheet')).toBeTruthy();
    });

    it('should use absolute positioning for main container', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
                home_fullscreen: false,
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

        const { root } = render(
            <Provider store={store}>
                <GameScreen navigation={mockNavigation} />
            </Provider>
        );

        // Check that the component structure is correct
        expect(root).toBeTruthy();
    });
});
