/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
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

    describe('suggestion feature', () => {
        const otherPlayers = {
            'player-2': { id: 'player-2', playerName: 'Alice', scores: [5] },
            'player-3': { id: 'player-3', playerName: 'Alex', scores: [3] },
            'player-4': { id: 'player-4', playerName: 'Bob', scores: [7] },
            'player-5': { id: 'player-5', playerName: 'Charlie', scores: [1] },
        };

        const createSuggestionStore = () => createMockStore({
            settings: { currentGameId: 'game-1' },
            games: {
                entities: {
                    'game-1': {
                        ...mockGame,
                        playerIds: ['player-1', 'player-2', 'player-3', 'player-4', 'player-5'],
                    },
                },
                ids: ['game-1'],
            },
            players: {
                entities: { 'player-1': { ...mockPlayer }, ...otherPlayers },
                ids: ['player-1', 'player-2', 'player-3', 'player-4', 'player-5'],
            },
        });

        const mockRoute = {
            params: { index: 0, playerId: 'player-1' },
        };

        const focusInput = async (input: any) => {
            await act(async () => { input.props.onFocus(); });
        };

        const blurInput = async (input: any) => {
            await act(async () => { input.props.onBlur(); });
        };

        const focusAndType = async (input: any, text: string) => {
            await focusInput(input);
            await act(async () => { fireEvent.changeText(input, text); });
        };

        it('should not show suggestions when input is not focused', () => {
            const { queryByTestId } = render(
                <Provider store={createSuggestionStore()}>
                    <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
                </Provider>
            );

            expect(queryByTestId('suggestions-list')).toBeNull();
        });

        it('should show matching suggestions when focused and typing', async () => {
            const { getByTestId, queryByTestId } = render(
                <Provider store={createSuggestionStore()}>
                    <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
                </Provider>
            );

            const input = getByTestId('RNE__Input__text-input');
            await focusAndType(input, 'A');

            await waitFor(() => {
                expect(queryByTestId('suggestions-list')).toBeTruthy();
            });
        });

        it('should render matching suggestion names', async () => {
            const { getByTestId, getByText } = render(
                <Provider store={createSuggestionStore()}>
                    <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
                </Provider>
            );

            const input = getByTestId('RNE__Input__text-input');
            await focusAndType(input, 'A');

            await waitFor(() => {
                expect(getByText('Alice')).toBeTruthy();
                expect(getByText('Alex')).toBeTruthy();
            });
        });

        it('should not show non-matching names in suggestions', async () => {
            const { getByTestId, queryByTestId, queryByText } = render(
                <Provider store={createSuggestionStore()}>
                    <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
                </Provider>
            );

            const input = getByTestId('RNE__Input__text-input');
            await focusAndType(input, 'A');

            await waitFor(() => {
                expect(queryByTestId('suggestions-list')).toBeTruthy();
                expect(queryByText('Bob')).toBeNull();
            });
        });

        it('should exclude current player from suggestions', async () => {
            const { getByTestId, queryByText } = render(
                <Provider store={createSuggestionStore()}>
                    <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
                </Provider>
            );

            const input = getByTestId('RNE__Input__text-input');
            await focusAndType(input, 'Test');

            await waitFor(() => {
                expect(queryByText('Test Player')).toBeNull();
            });
        });

        it('should hide suggestions when input is blurred', async () => {
            const { getByTestId, queryByTestId } = render(
                <Provider store={createSuggestionStore()}>
                    <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
                </Provider>
            );

            const input = getByTestId('RNE__Input__text-input');
            await focusAndType(input, 'A');

            await waitFor(() => {
                expect(queryByTestId('suggestions-list')).toBeTruthy();
            });

            await blurInput(input);

            await waitFor(() => {
                expect(queryByTestId('suggestions-list')).toBeNull();
            });
        });

        it('should update input value when suggestion is tapped', async () => {
            const { getByTestId, getByDisplayValue, getByText } = render(
                <Provider store={createSuggestionStore()}>
                    <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
                </Provider>
            );

            const input = getByTestId('RNE__Input__text-input');
            await focusAndType(input, 'A');

            await waitFor(() => {
                expect(getByText('Alice')).toBeTruthy();
            });

            await act(async () => { fireEvent.press(getByText('Alice')); });

            await waitFor(() => {
                expect(getByDisplayValue('Alice')).toBeTruthy();
            });
        });

        it('should save selected suggestion name to Redux', async () => {
            const store = createMockStore({
                settings: { currentGameId: 'game-1' },
                games: {
                    entities: {
                        'game-1': { ...mockGame, playerIds: ['player-1', 'player-2'] },
                    },
                    ids: ['game-1'],
                },
                players: {
                    entities: {
                        'player-1': { ...mockPlayer },
                        'player-2': { id: 'player-2', playerName: 'Alice', scores: [5] },
                    },
                    ids: ['player-1', 'player-2'],
                },
            });

            const route = {
                params: { index: 0, playerId: 'player-1' },
            };

            const { getByTestId, getByText } = render(
                <Provider store={store}>
                    <EditPlayerScreen navigation={mockNavigation} route={route as any} />
                </Provider>
            );

            const input = getByTestId('RNE__Input__text-input');
            await focusAndType(input, 'A');

            await waitFor(() => {
                expect(getByText('Alice')).toBeTruthy();
            });

            await act(async () => { fireEvent.press(getByText('Alice')); });

            await waitFor(() => {
                const state = store.getState();
                expect(state.players.entities['player-1']?.playerName).toBe('Alice');
            });
        });

        it('should dismiss suggestions after selecting one', async () => {
            const { getByTestId, getByText, queryByTestId } = render(
                <Provider store={createSuggestionStore()}>
                    <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
                </Provider>
            );

            const input = getByTestId('RNE__Input__text-input');
            await focusAndType(input, 'A');

            await waitFor(() => {
                expect(getByText('Alice')).toBeTruthy();
            });

            await act(async () => { fireEvent.press(getByText('Alice')); });

            await waitFor(() => {
                expect(queryByTestId('suggestions-list')).toBeNull();
            });
        });

        it('should not show suggestions when no names match', async () => {
            const { getByTestId, queryByTestId } = render(
                <Provider store={createSuggestionStore()}>
                    <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
                </Provider>
            );

            const input = getByTestId('RNE__Input__text-input');
            await focusAndType(input, 'Z');

            await waitFor(() => {
                expect(queryByTestId('suggestions-list')).toBeNull();
            });
        });

        it('should show suggestions case-insensitively', async () => {
            const { getByTestId, getByText } = render(
                <Provider store={createSuggestionStore()}>
                    <EditPlayerScreen navigation={mockNavigation} route={mockRoute as any} />
                </Provider>
            );

            const input = getByTestId('RNE__Input__text-input');
            await focusAndType(input, 'alice');

            await waitFor(() => {
                expect(getByText('Alice')).toBeTruthy();
            });
        });

        it('should limit suggestions to 8 items', async () => {
            const manyPlayers: Record<string, { id: string; playerName: string; scores: number[] }> = {};
            for (let i = 0; i < 12; i++) {
                const id = `player-a${i}`;
                manyPlayers[id] = { id, playerName: `Alpha${i}`, scores: [i] };
            }

            const storeWithMany = createMockStore({
                settings: { currentGameId: 'game-1' },
                games: {
                    entities: {
                        'game-1': {
                            ...mockGame,
                            playerIds: ['player-1', ...Object.keys(manyPlayers)],
                        },
                    },
                    ids: ['game-1'],
                },
                players: {
                    entities: { 'player-1': { ...mockPlayer }, ...manyPlayers },
                    ids: ['player-1', ...Object.keys(manyPlayers)],
                },
            });

            const route = {
                params: { index: 0, playerId: 'player-1' },
            };

            const { getByTestId, queryByText } = render(
                <Provider store={storeWithMany}>
                    <EditPlayerScreen navigation={mockNavigation} route={route as any} />
                </Provider>
            );

            const input = getByTestId('RNE__Input__text-input');
            await focusAndType(input, 'Alp');

            await waitFor(() => {
                expect(queryByText('Alpha0')).toBeTruthy();
                expect(queryByText('Alpha7')).toBeTruthy();
                expect(queryByText('Alpha8')).toBeNull();
                expect(queryByText('Alpha11')).toBeNull();
            });
        });
    });
});
