import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';

import SettingsScreen from './SettingsScreen';

// Mock Analytics
jest.mock('../Analytics', () => ({
    logEvent: jest.fn(),
}));

// Mock react-native-elements
jest.mock('react-native-elements', () => {
    const { TouchableOpacity, Text, View } = require('react-native');
    
    return {
        Button: ({ title, onPress, disabled, testID }: { 
            title: string; 
            onPress: () => void; 
            disabled?: boolean; 
            testID?: string; 
        }) => (
            <TouchableOpacity onPress={onPress} disabled={disabled} testID={testID}>
                <Text>{title}</Text>
            </TouchableOpacity>
        ),
        Icon: ({ name, testID }: { name: string; testID?: string }) => (
            <View testID={testID}>
                <Text>{name}</Text>
            </View>
        ),
    };
});

// Mock DraggableFlatList and ScaleDecorator
jest.mock('react-native-draggable-flatlist', () => {
    const { FlatList } = require('react-native');
    
    const MockDraggableFlatList = ({ data, renderItem, keyExtractor, ListFooterComponent, ...props }: {
        data: string[];
        renderItem: ({ item, getIndex, drag, isActive }: {
            item: string;
            getIndex: () => number;
            drag: () => void;
            isActive: boolean;
        }) => React.ReactElement;
        keyExtractor: (item: string) => string;
        ListFooterComponent: React.ComponentType;
        [key: string]: unknown;
    }) => {
        return (
            <FlatList
                data={data}
                renderItem={({ item, index }: { item: string; index: number }) => {
                    const mockDrag = jest.fn();
                    const mockGetIndex = () => index;
                    return renderItem({ 
                        item, 
                        getIndex: mockGetIndex, 
                        drag: mockDrag, 
                        isActive: false 
                    });
                }}
                keyExtractor={keyExtractor}
                ListFooterComponent={ListFooterComponent}
                testID="draggable-flatlist"
                {...props}
            />
        );
    };

    const MockScaleDecorator = ({ children }: { children: React.ReactNode }) => children;

    return {
        __esModule: true,
        default: MockDraggableFlatList,
        ScaleDecorator: MockScaleDecorator,
    };
});

// Mock components
jest.mock('../components/EditGame', () => {
    return function MockEditGame() {
        const { View, Text } = require('react-native');
        return <View testID="edit-game"><Text>Edit Game</Text></View>;
    };
});

jest.mock('../components/PlayerListItem', () => {
    return function MockPlayerListItem({ playerId, edit, drag, isActive, index }: {
        playerId: string;
        edit: boolean;
        drag: () => void;
        isActive: boolean;
        index: number;
    }) {
        const { View, Text, TouchableOpacity } = require('react-native');
        return (
            <View testID={`player-list-item-${playerId}`}>
                <Text>Player: {playerId}</Text>
                <Text>Edit Mode: {edit.toString()}</Text>
                <Text>Active: {isActive.toString()}</Text>
                <Text>Index: {index}</Text>
                <TouchableOpacity testID={`drag-handle-${playerId}`} onPress={() => drag()}>
                    <Text>Drag</Text>
                </TouchableOpacity>
            </View>
        );
    };
});

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

const mockRoute = {
    key: 'Settings',
    name: 'Settings' as const,
    params: { source: 'test' },
};

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

describe('SettingsScreen', () => {
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
                <SettingsScreen navigation={mockNavigation} route={mockRoute} />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render null when no player IDs are available', () => {
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
                entities: {},
                ids: [],
            },
        });

        const { toJSON } = render(
            <Provider store={store}>
                <SettingsScreen navigation={mockNavigation} route={mockRoute} />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render game settings when current game is available', () => {
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

        const { getByText, getByTestId } = render(
            <Provider store={store}>
                <SettingsScreen navigation={mockNavigation} route={mockRoute} />
            </Provider>
        );

        expect(getByText('Game Title')).toBeTruthy();
        expect(getByText('Players')).toBeTruthy();
        expect(getByTestId('edit-game')).toBeTruthy();
        expect(getByTestId('draggable-flatlist')).toBeTruthy();
    });

    it('should show edit button when there are multiple players', () => {
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
                <SettingsScreen navigation={mockNavigation} route={mockRoute} />
            </Provider>
        );

        expect(getByText('Edit')).toBeTruthy();
    });

    it('should not show edit button when there is only one player', () => {
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
                entities: {
                    'player-1': mockPlayers['player-1'],
                },
                ids: ['player-1'],
            },
        });

        const { queryByText } = render(
            <Provider store={store}>
                <SettingsScreen navigation={mockNavigation} route={mockRoute} />
            </Provider>
        );

        expect(queryByText('Edit')).toBeNull();
    });

    it('should toggle edit mode when edit button is pressed', async () => {
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
                <SettingsScreen navigation={mockNavigation} route={mockRoute} />
            </Provider>
        );

        const editButton = getByText('Edit');
        fireEvent.press(editButton);

        await waitFor(() => {
            expect(getByText('Done')).toBeTruthy();
        });

        expect(logEvent).toHaveBeenCalledWith('edit_players', {
            game_id: 'game-1',
            player_count: 2,
        });
    });

    it('should show add player button when under max players', () => {
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
                <SettingsScreen navigation={mockNavigation} route={mockRoute} />
            </Provider>
        );

        expect(getByText('Add Player')).toBeTruthy();
    });

    it('should add a player when add player button is pressed', async () => {
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
                <SettingsScreen navigation={mockNavigation} route={mockRoute} />
            </Provider>
        );

        const addPlayerButton = getByText('Add Player');
        fireEvent.press(addPlayerButton);

        await waitFor(() => {
            expect(logEvent).toHaveBeenCalledWith('add_player', {
                game_id: 'game-1',
                player_count: 3,
            });
        });
    });

    it('should render player list items', () => {
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
                <SettingsScreen navigation={mockNavigation} route={mockRoute} />
            </Provider>
        );

        expect(getByTestId('player-list-item-player-1')).toBeTruthy();
        expect(getByTestId('player-list-item-player-2')).toBeTruthy();
    });
});
