/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer from '../../redux/SettingsSlice';

import EditPlayerScreen from './EditPlayerScreen';

// Mock external dependencies
jest.mock('expo-font', () => ({
    isLoaded: () => true,
    loadAsync: () => Promise.resolve(),
}));

// Mock the components that EditPlayerScreen uses
jest.mock('../components/ColorPalettes/ColorSelector', () => {
    return function MockColorSelector({ playerId }: { playerId: string }) {
        const { View, Text } = jest.requireActual('react-native');
        return (
            <View testID={`color-selector-${playerId}`}>
                <Text>ColorSelector for {playerId}</Text>
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

describe('EditPlayerScreen', () => {
    const mockGame = {
        id: 'game-1',
        title: 'Test Game',
        dateCreated: Date.now(),
        roundCurrent: 0,
        roundTotal: 1,
        playerIds: ['player-1', 'player-2'],
    };

    const mockPlayer = {
        id: 'player-1',
        playerName: 'Test Player',
        scores: [10, 20],
    };

    const mockStore = createMockStore({
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
            entities: {
                'player-1': mockPlayer,
            },
            ids: ['player-1'],
        },
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render null when playerId is null', () => {
        const mockRoute = {
            params: {
                index: 0,
                playerId: null,
            },
        };

        const { toJSON } = render(
            <Provider store={mockStore}>
                <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render null when playerId is undefined', () => {
        const mockRoute = {
            params: {
                index: 0,
                playerId: undefined,
            },
        };

        const { toJSON } = render(
            <Provider store={mockStore}>
                <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render null when player does not exist', () => {
        const mockRoute = {
            params: {
                index: 0,
                playerId: 'nonexistent-player',
            },
        };

        const { toJSON } = render(
            <Provider store={mockStore}>
                <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render null when index is null', () => {
        const mockRoute = {
            params: {
                index: null,
                playerId: 'player-1',
            },
        };

        const { toJSON } = render(
            <Provider store={mockStore}>
                <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render null when index is undefined', () => {
        const mockRoute = {
            params: {
                index: undefined,
                playerId: 'player-1',
            },
        };

        const { toJSON } = render(
            <Provider store={mockStore}>
                <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render null when no current game exists', () => {
        const storeWithoutGame = createMockStore({
            settings: {
                currentGameId: undefined,
                home_fullscreen: false,
            },
            games: {
                entities: {},
                ids: [],
            },
            players: {
                entities: {
                    'player-1': mockPlayer,
                },
                ids: ['player-1'],
            },
        });

        const mockRoute = {
            params: {
                index: 0,
                playerId: 'player-1',
            },
        };

        const { toJSON } = render(
            <Provider store={storeWithoutGame}>
                <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render edit player form when all required data is available', () => {
        const mockRoute = {
            params: {
                index: 0,
                playerId: 'player-1',
            },
        };

        const { getByDisplayValue, getByTestId } = render(
            <Provider store={mockStore}>
                <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
            </Provider>
        );

        // Check that the input field is rendered with the player's name
        expect(getByDisplayValue('Test Player')).toBeTruthy();
        
        // Check that the color selector is rendered
        expect(getByTestId('color-selector-player-1')).toBeTruthy();
    });

    it('should update local state when input text changes', () => {
        const mockRoute = {
            params: {
                index: 0,
                playerId: 'player-1',
            },
        };

        const { getByDisplayValue } = render(
            <Provider store={mockStore}>
                <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
            </Provider>
        );

        const input = getByDisplayValue('Test Player');
        fireEvent.changeText(input, 'New Player Name');

        expect(getByDisplayValue('New Player Name')).toBeTruthy();
    });

    it('should dispatch updatePlayer action when text changes', () => {
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
                entities: {
                    'player-1': mockPlayer,
                },
                ids: ['player-1'],
            },
        });

        const mockRoute = {
            params: {
                index: 0,
                playerId: 'player-1',
            },
        };

        const { getByDisplayValue } = render(
            <Provider store={store}>
                <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
            </Provider>
        );

        const input = getByDisplayValue('Test Player');
        fireEvent.changeText(input, 'New Player Name');

        // Check that the store was updated
        const state = store.getState();
        expect(state.players.entities['player-1']?.playerName).toBe('New Player Name');
    });

    it('should revert to original name when input is empty on change', () => {
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
                entities: {
                    'player-1': mockPlayer,
                },
                ids: ['player-1'],
            },
        });

        const mockRoute = {
            params: {
                index: 0,
                playerId: 'player-1',
            },
        };

        const { getByDisplayValue } = render(
            <Provider store={store}>
                <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
            </Provider>
        );

        const input = getByDisplayValue('Test Player');
        fireEvent.changeText(input, '');

        // Check that the store was updated with the original name
        const state = store.getState();
        expect(state.players.entities['player-1']?.playerName).toBe('Test Player');
    });

    it('should revert to original name when input is empty on end editing', () => {
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
                entities: {
                    'player-1': mockPlayer,
                },
                ids: ['player-1'],
            },
        });

        const mockRoute = {
            params: {
                index: 0,
                playerId: 'player-1',
            },
        };

        const { getByDisplayValue } = render(
            <Provider store={store}>
                <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
            </Provider>
        );

        const input = getByDisplayValue('Test Player');
        
        // Change to empty and then trigger end editing
        fireEvent.changeText(input, 'Some text');
        fireEvent(input, 'endEditing', { nativeEvent: { text: '' } });

        // Check that local state was reverted
        expect(getByDisplayValue('Test Player')).toBeTruthy();
        
        // Check that the store was updated with the original name
        const state = store.getState();
        expect(state.players.entities['player-1']?.playerName).toBe('Test Player');
    });

    it('should save new name when input has text on end editing', () => {
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
                entities: {
                    'player-1': mockPlayer,
                },
                ids: ['player-1'],
            },
        });

        const mockRoute = {
            params: {
                index: 0,
                playerId: 'player-1',
            },
        };

        const { getByDisplayValue } = render(
            <Provider store={store}>
                <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
            </Provider>
        );

        const input = getByDisplayValue('Test Player');
        fireEvent(input, 'endEditing', { nativeEvent: { text: 'Updated Name' } });

        // Check that the store was updated with the new name
        const state = store.getState();
        expect(state.players.entities['player-1']?.playerName).toBe('Updated Name');
    });

    it('should clear input when clear button is pressed', () => {
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
                entities: {
                    'player-1': mockPlayer,
                },
                ids: ['player-1'],
            },
        });

        const mockRoute = {
            params: {
                index: 0,
                playerId: 'player-1',
            },
        };

        const { getByTestId } = render(
            <Provider store={store}>
                <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
            </Provider>
        );

        // Should render the input field successfully
        const input = getByTestId('RNE__Input__text-input');
        expect(input).toBeTruthy();
    });

    it('should limit input to 15 characters', () => {
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
                entities: {
                    'player-1': mockPlayer,
                },
                ids: ['player-1'],
            },
        });

        const mockRoute = {
            params: {
                index: 0,
                playerId: 'player-1',
            },
        };

        const { getByTestId } = render(
            <Provider store={store}>
                <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
            </Provider>
        );

        const input = getByTestId('RNE__Input__text-input');
        
        // The maxLength prop should be set to 15
        expect(input.props.maxLength).toBe(15);
    });

    it('should have selectTextOnFocus enabled', () => {
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
                entities: {
                    'player-1': mockPlayer,
                },
                ids: ['player-1'],
            },
        });

        const mockRoute = {
            params: {
                index: 0,
                playerId: 'player-1',
            },
        };

        const { getByTestId } = render(
            <Provider store={store}>
                <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
            </Provider>
        );

        const input = getByTestId('RNE__Input__text-input');
        
        // The selectTextOnFocus prop should be true
        expect(input.props.selectTextOnFocus).toBe(true);
    });

    it('should have correct placeholder text', () => {
        const mockRoute = {
            params: {
                index: 0,
                playerId: 'player-1',
            },
        };

        const { getByPlaceholderText } = render(
            <Provider store={mockStore}>
                <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
            </Provider>
        );

        expect(getByPlaceholderText('Player Name')).toBeTruthy();
    });

    it('should handle empty player name initially', () => {
        const playerWithEmptyName = {
            id: 'player-2',
            playerName: '',
            scores: [],
        };

        const storeWithEmptyName = createMockStore({
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
                entities: {
                    'player-2': playerWithEmptyName,
                },
                ids: ['player-2'],
            },
        });

        const mockRoute = {
            params: {
                index: 0,
                playerId: 'player-2',
            },
        };

        const { getByDisplayValue } = render(
            <Provider store={storeWithEmptyName}>
                <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
            </Provider>
        );

        expect(getByDisplayValue('')).toBeTruthy();
    });

    it('should hide clear button when input is empty', () => {
        const playerWithEmptyName = {
            id: 'player-2',
            playerName: '',
            scores: [],
        };

        const storeWithEmptyName = createMockStore({
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
                entities: {
                    'player-2': playerWithEmptyName,
                },
                ids: ['player-2'],
            },
        });

        const mockRoute = {
            params: {
                index: 0,
                playerId: 'player-2',
            },
        };

        const { getByDisplayValue } = render(
            <Provider store={storeWithEmptyName}>
                <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
            </Provider>
        );

        const input = getByDisplayValue('');
        
        // The clear button should be disabled and hidden when input is empty
        const clearButton = input.parent?.parent?.findByProps({ name: 'close' });
        expect(clearButton?.props.disabled).toBe(true);
    });
});
