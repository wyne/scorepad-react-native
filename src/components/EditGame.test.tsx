import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer from '../../redux/SettingsSlice';

import EditGame from './EditGame';

// Mock react-native-elements
jest.mock('react-native-elements', () => {
    const React = jest.requireActual('react');
    const { Pressable, TextInput } = jest.requireActual('react-native');

    return {
        Input: React.forwardRef(({ value, onChangeText, onEndEditing, onSubmitEditing, onBlur, placeholder, testID, rightIcon, ...props }: {
            value: string;
            onChangeText: (text: string) => void;
            onEndEditing: (e: { nativeEvent: { text: string } }) => void;
            onSubmitEditing: (e: { nativeEvent: { text: string } }) => void;
            onBlur: () => void;
            placeholder: string;
            rightIcon?: { onPress: () => void; name: string };
            testID?: string;
        }, ref: React.Ref<{ focus: () => void }>) => {
            React.useImperativeHandle(ref, () => ({
                focus: jest.fn(),
            }));

            return (
                <>
                    <TextInput
                        onBlur={onBlur}
                        onChangeText={onChangeText}
                        onEndEditing={(e: { nativeEvent: { text: string } }) => onEndEditing({ nativeEvent: { text: e.nativeEvent.text } })}
                        onSubmitEditing={(e: { nativeEvent: { text: string } }) => onSubmitEditing({ nativeEvent: { text: e.nativeEvent.text } })}
                        placeholder={placeholder}
                        testID={testID || 'game-title-input'}
                        value={value}
                        {...props}
                    />
                    {rightIcon != null && (
                        <Pressable onPress={rightIcon.onPress} testID="game-title-clear-button" />
                    )}
                </>
            );
        }),
    };
});

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({
        addListener: jest.fn(() => jest.fn()),
    }),
}));

// Mock PaletteSelector component
jest.mock('./ColorPalettes/PaletteSelector', () => {
    return function MockPaletteSelector() {
        const { View, Text } = jest.requireActual('react-native');
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
        Object.defineProperty(Platform, 'OS', {
            configurable: true,
            value: 'ios',
        });
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
        
        fireEvent.changeText(input, 'New Game Title');

        const state = store.getState();
        expect(state.games.entities['game-1']?.title).toBe('Test Game');

        fireEvent(input, 'endEditing', {
            nativeEvent: { text: 'New Game Title' }
        });

        const stateAfter = store.getState();
        expect(stateAfter.games.entities['game-1']?.title).toBe('New Game Title');
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
        
        fireEvent.changeText(input, '');
        fireEvent(input, 'endEditing', {
            nativeEvent: { text: '' }
        });

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
        
        // Trigger end editing event (onBlur doesn't carry text data)
        fireEvent(input, 'onEndEditing', {
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
        expect(input.props.value).toBe('');
    });

    it('should use native replacement affordances', () => {
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

        expect(input.props.clearButtonMode).toBe('while-editing');
        expect(input.props.returnKeyType).toBe('done');
        expect(input.props.selectTextOnFocus).toBe(true);
    });

    it('should clear the game title locally with the Android clear button', () => {
        Object.defineProperty(Platform, 'OS', {
            configurable: true,
            value: 'android',
        });

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

        const { getByDisplayValue, getByTestId } = render(
            <Provider store={store}>
                <EditGame />
            </Provider>
        );

        fireEvent.press(getByTestId('game-title-clear-button'));

        expect(getByDisplayValue('')).toBeTruthy();
        expect(store.getState().games.entities['game-1']?.title).toBe('Test Game');
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
        
        fireEvent.changeText(input, longTitle);
        fireEvent(input, 'endEditing', {
            nativeEvent: { text: longTitle }
        });

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
        
        fireEvent.changeText(input, specialTitle);
        fireEvent(input, 'endEditing', {
            nativeEvent: { text: specialTitle }
        });

        const state = store.getState();
        expect(state.games.entities['game-1']?.title).toBe(specialTitle);
    });
});
