import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer from '../../redux/SettingsSlice';

import EditGame from './EditGame';

// Mock react-native-elements
jest.mock('react-native-elements', () => ({
    Input: ({ defaultValue, onChangeText, onEndEditing, onBlur, placeholder, testID }: {
        defaultValue: string;
        onChangeText: (text: string) => void;
        onEndEditing: (e: { nativeEvent: { text: string } }) => void;
        onBlur: (e: { nativeEvent: { text: string } }) => void;
        placeholder: string;
        testID?: string;
    }) => {
        const { TextInput } = require('react-native');
        return (
            <TextInput
                defaultValue={defaultValue}
                onChangeText={onChangeText}
                onEndEditing={(e: { nativeEvent: { text: string } }) => onEndEditing({ nativeEvent: { text: e.nativeEvent.text } })}
                onBlur={(e: { nativeEvent: { text: string } }) => onBlur({ nativeEvent: { text: e.nativeEvent.text } })}
                placeholder={placeholder}
                testID={testID || 'game-title-input'}
            />
        );
    },
}));

// Mock PaletteSelector component
jest.mock('./ColorPalettes/PaletteSelector', () => {
    return function MockPaletteSelector() {
        const { View, Text } = require('react-native');
        return (
            <View testID="palette-selector">
                <Text>Color Palette Selector</Text>
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

describe('EditGame', () => {
    const mockGame = {
        id: 'game-1',
        title: 'Test Game',
        dateCreated: 1640995200000, // January 1, 2022, 00:00:00 UTC
        roundCurrent: 1,
        roundTotal: 3,
        playerIds: ['player-1', 'player-2'],
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
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render null when no current game is set', () => {
        const store = createMockStore({
            settings: {
                currentGameId: undefined,
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
                <EditGame />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render game title input when current game exists', () => {
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

        const { getByTestId, getByDisplayValue } = render(
            <Provider store={store}>
                <EditGame />
            </Provider>
        );

        expect(getByTestId('game-title-input')).toBeTruthy();
        expect(getByDisplayValue('Test Game')).toBeTruthy();
    });

    it('should display creation date and time', () => {
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

        const { getByText } = render(
            <Provider store={store}>
                <EditGame />
            </Provider>
        );

        // Check that creation date is displayed
        expect(getByText(/Created:/)).toBeTruthy();
    });

    it('should render palette selector', () => {
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
                <EditGame />
            </Provider>
        );

        expect(getByTestId('palette-selector')).toBeTruthy();
    });

    it('should update local title when text changes', () => {
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
                <EditGame />
            </Provider>
        );

        const input = getByTestId('game-title-input');
        
        // Change text to new title
        fireEvent.changeText(input, 'New Game Title');

        // Check that the change was dispatched to Redux
        const state = store.getState();
        expect(state.games.entities['game-1']?.title).toBe('New Game Title');
    });

    it('should set title to "Untitled" when empty text is entered', () => {
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
                <EditGame />
            </Provider>
        );

        const input = getByTestId('game-title-input');
        
        // Change text to empty string
        fireEvent.changeText(input, '');

        // Check that title was set to "Untitled"
        const state = store.getState();
        expect(state.games.entities['game-1']?.title).toBe('Untitled');
    });

    it('should handle onEndEditing with valid text', () => {
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
                <EditGame />
            </Provider>
        );

        const input = getByTestId('game-title-input');
        
        // Trigger end editing with new text
        fireEvent(input, 'endEditing', {
            nativeEvent: { text: 'Final Game Title' }
        });

        // Check that the title was updated
        const state = store.getState();
        expect(state.games.entities['game-1']?.title).toBe('Final Game Title');
    });

    it('should handle onEndEditing with empty text', () => {
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
                <EditGame />
            </Provider>
        );

        const input = getByTestId('game-title-input');
        
        // Trigger end editing with empty text
        fireEvent(input, 'endEditing', {
            nativeEvent: { text: '' }
        });

        // Check that title was set to "Untitled"
        const state = store.getState();
        expect(state.games.entities['game-1']?.title).toBe('Untitled');
    });

    it('should handle onBlur event', () => {
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
                <EditGame />
            </Provider>
        );

        const input = getByTestId('game-title-input');
        
        // Trigger blur event
        fireEvent(input, 'blur', {
            nativeEvent: { text: 'Blur Test Title' }
        });

        // Check that the title was updated
        const state = store.getState();
        expect(state.games.entities['game-1']?.title).toBe('Blur Test Title');
    });

    it('should display correct placeholder text', () => {
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

        const { getByPlaceholderText } = render(
            <Provider store={store}>
                <EditGame />
            </Provider>
        );

        expect(getByPlaceholderText('Untitled')).toBeTruthy();
    });

    it('should handle game with empty title initially', () => {
        const gameWithEmptyTitle = {
            ...mockGame,
            title: '',
        };

        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': gameWithEmptyTitle,
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
                <EditGame />
            </Provider>
        );

        const input = getByTestId('game-title-input');
        expect(input.props.defaultValue).toBe('');
    });

    it('should handle very long titles within character limit', () => {
        const longTitle = 'A'.repeat(30); // Max length is 30

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
                <EditGame />
            </Provider>
        );

        const input = getByTestId('game-title-input');
        
        // Change text to long title
        fireEvent.changeText(input, longTitle);

        // Check that the title was updated
        const state = store.getState();
        expect(state.games.entities['game-1']?.title).toBe(longTitle);
    });

    it('should handle special characters in title', () => {
        const specialTitle = 'Game #1 - Test & Fun! 🎮';

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
                <EditGame />
            </Provider>
        );

        const input = getByTestId('game-title-input');
        
        // Change text to title with special characters
        fireEvent.changeText(input, specialTitle);

        // Check that the title was updated correctly
        const state = store.getState();
        expect(state.games.entities['game-1']?.title).toBe(specialTitle);
    });
});
