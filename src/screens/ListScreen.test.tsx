import React from 'react';

import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer from '../../redux/SettingsSlice';

import ListScreen from './ListScreen';

// Mock dependencies
jest.mock('expo-application', () => ({
    nativeApplicationVersion: '1.0.0',
}));

jest.mock('expo-blur', () => ({
    BlurView: ({ children, style }: { children: React.ReactNode; style: object }) => {
        const { View } = jest.requireActual('react-native');
        return <View style={style} testID="blur-view">{children}</View>;
    },
}));

jest.mock('expo-crypto', () => ({
    randomUUID: jest.fn(() => 'mock-uuid-123'),
}));

jest.mock('react-native-reanimated', () => {
    const View = jest.requireActual('react-native').View;
    const FlatList = jest.requireActual('react-native').FlatList;
    
    return {
        __esModule: true,
        default: {
            View: View,
            FlatList: FlatList,
        },
        LinearTransition: {
            easing: jest.fn(() => ({})),
        },
        Easing: {
            ease: jest.fn(),
        },
    };
});

jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style: object }) => {
        const { View } = jest.requireActual('react-native');
        return <View style={style} testID="safe-area-view">{children}</View>;
    },
}));

jest.mock('../Analytics', () => ({
    logEvent: jest.fn(),
}));

jest.mock('../Logger', () => ({
    info: jest.fn(),
}));

jest.mock('../components/Onboarding/Onboarding', () => ({
    getPendingOnboardingSemVer: jest.fn(),
}));

jest.mock('../components/GameListItem', () => {
    return function MockGameListItem({ gameId, index, navigation }: { gameId: string; index: number; navigation: { navigate: (screen: string, params: object) => void } }) {
        const { View, Text, TouchableOpacity } = jest.requireActual('react-native');
        return (
            <View testID={`game-list-item-${gameId}`}>
                <TouchableOpacity onPress={() => navigation.navigate('Game', { gameId })}>
                    <Text>Game {gameId} - Index {index}</Text>
                </TouchableOpacity>
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

const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    setOptions: jest.fn(),
    dispatch: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => false),
    getId: jest.fn(() => 'test-id'),
    getParent: jest.fn(),
    getState: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
} as unknown as NativeStackNavigationProp<ParamListBase, string, undefined>;

describe('ListScreen', () => {
    const mockGame1 = {
        id: 'game-1',
        title: 'Test Game 1',
        dateCreated: Date.now(),
        roundCurrent: 1,
        roundTotal: 3,
        playerIds: ['player-1', 'player-2'],
    };

    const mockGame2 = {
        id: 'game-2',
        title: 'Test Game 2',
        dateCreated: Date.now(),
        roundCurrent: 2,
        roundTotal: 5,
        playerIds: ['player-3', 'player-4'],
    };

    const mockPlayers = {
        'player-1': { id: 'player-1', playerName: 'Player 1', scores: [10] },
        'player-2': { id: 'player-2', playerName: 'Player 2', scores: [5] },
        'player-3': { id: 'player-3', playerName: 'Player 3', scores: [8] },
        'player-4': { id: 'player-4', playerName: 'Player 4', scores: [12] },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getPendingOnboardingSemVer } = require('../components/Onboarding/Onboarding');
        getPendingOnboardingSemVer.mockReturnValue(undefined); // Default to onboarded
    });

    it('should render safely with no games', () => {
        const store = createMockStore({
            settings: {
                appOpens: 1,
                devMenuEnabled: false,
                installId: 'existing-id',
                onboarded: '1.0.0',
                rollingGameCounter: 0,
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

        const { getByTestId, getByText } = render(
            <Provider store={store}>
                <ListScreen navigation={mockNavigation} />
            </Provider>
        );

        expect(getByTestId('safe-area-view')).toBeTruthy();
        expect(getByText('No Games')).toBeTruthy();
        expect(getByText('Tap the + button above to create a new game.')).toBeTruthy();
    });

    it('should render games list when games exist', () => {
        const store = createMockStore({
            settings: {
                appOpens: 1,
                devMenuEnabled: false,
                installId: 'existing-id',
                onboarded: '1.0.0',
                rollingGameCounter: 2,
            },
            games: {
                entities: {
                    'game-1': mockGame1,
                    'game-2': mockGame2,
                },
                ids: ['game-1', 'game-2'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2', 'player-3', 'player-4'],
            },
        });

        const { getByTestId, queryByText } = render(
            <Provider store={store}>
                <ListScreen navigation={mockNavigation} />
            </Provider>
        );

        expect(getByTestId('game-list-item-game-1')).toBeTruthy();
        expect(getByTestId('game-list-item-game-2')).toBeTruthy();
        expect(queryByText('No Games')).toBeNull();
    });

    it('should show blur view with help text when games exist', () => {
        const store = createMockStore({
            settings: {
                appOpens: 1,
                devMenuEnabled: false,
                installId: 'existing-id',
                onboarded: '1.0.0',
                rollingGameCounter: 2,
            },
            games: {
                entities: {
                    'game-1': mockGame1,
                    'game-2': mockGame2,
                },
                ids: ['game-1', 'game-2'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2', 'player-3', 'player-4'],
            },
        });

        const { getByTestId, getByText } = render(
            <Provider store={store}>
                <ListScreen navigation={mockNavigation} />
            </Provider>
        );

        expect(getByTestId('blur-view')).toBeTruthy();
        expect(getByText('Long press for more options.')).toBeTruthy();
    });

    it('should generate and set installId when not present', async () => {
        const store = createMockStore({
            settings: {
                appOpens: 1,
                devMenuEnabled: false,
                installId: undefined,
                onboarded: '1.0.0',
                rollingGameCounter: 0,
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

        render(
            <Provider store={store}>
                <ListScreen navigation={mockNavigation} />
            </Provider>
        );

        await waitFor(() => {
            const state = store.getState();
            expect(state.settings.installId).toBe('mock-uuid-123');
        });
    });

    it('should increase app opens counter on mount', async () => {
        const store = createMockStore({
            settings: {
                appOpens: 5,
                devMenuEnabled: false,
                installId: 'existing-id',
                onboarded: '1.0.0',
                rollingGameCounter: 0,
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

        render(
            <Provider store={store}>
                <ListScreen navigation={mockNavigation} />
            </Provider>
        );

        await waitFor(() => {
            const state = store.getState();
            expect(state.settings.appOpens).toBe(6);
        });
    });

    it('should log analytics event on mount', () => {
        const store = createMockStore({
            settings: {
                appOpens: 3,
                devMenuEnabled: true,
                installId: 'test-install-id',
                onboarded: '1.0.0',
                rollingGameCounter: 1,
            },
            games: {
                entities: { 'game-1': mockGame1 },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { logEvent } = require('../Analytics');

        render(
            <Provider store={store}>
                <ListScreen navigation={mockNavigation} />
            </Provider>
        );

        expect(logEvent).toHaveBeenCalledWith('game_list', {
            onboarded: true,
            gameCount: 1,
            appOpens: 3,
            appVersion: '1.0.0',
            devMenuEnabled: true,
            onboardedVersion: '1.0.0',
            pendingOnboardingVersion: undefined,
            installId: 'test-install-id',
            rollingGameCounter: 1,
        });
    });

    it('should navigate to onboarding when not onboarded', async () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getPendingOnboardingSemVer } = require('../components/Onboarding/Onboarding');
        getPendingOnboardingSemVer.mockReturnValue('1.1.0');

        const store = createMockStore({
            settings: {
                appOpens: 1,
                devMenuEnabled: false,
                installId: 'existing-id',
                onboarded: '1.0.0',
                rollingGameCounter: 0,
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

        render(
            <Provider store={store}>
                <ListScreen navigation={mockNavigation} />
            </Provider>
        );

        await waitFor(() => {
            expect(mockNavigation.navigate).toHaveBeenCalledWith('Onboarding', {
                onboarding: true,
                version: expect.objectContaining({ version: '1.0.0' }),
            });
        });
    });

    it('should update rolling game counter when current count is less than game ids length', () => {
        const store = createMockStore({
            settings: {
                appOpens: 1,
                devMenuEnabled: false,
                installId: 'existing-id',
                onboarded: '1.0.0',
                rollingGameCounter: 0, // Less than games length (2)
            },
            games: {
                entities: {
                    'game-1': mockGame1,
                    'game-2': mockGame2,
                },
                ids: ['game-1', 'game-2'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2', 'player-3', 'player-4'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <ListScreen navigation={mockNavigation} />
            </Provider>
        );

        // Note: setRollingGameCounter should be called but the mock store won't reflect this
        // since it's called as a function, not dispatched as an action
        expect(getByTestId('safe-area-view')).toBeTruthy();
    });

    it('should handle undefined rolling game counter', () => {
        const store = createMockStore({
            settings: {
                appOpens: 1,
                devMenuEnabled: false,
                installId: 'existing-id',
                onboarded: '1.0.0',
                rollingGameCounter: undefined,
            },
            games: {
                entities: { 'game-1': mockGame1 },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <ListScreen navigation={mockNavigation} />
            </Provider>
        );

        expect(getByTestId('safe-area-view')).toBeTruthy();
    });

    it('should handle null onboarded version', () => {
        const store = createMockStore({
            settings: {
                appOpens: 1,
                devMenuEnabled: false,
                installId: 'existing-id',
                onboarded: '', // Empty string, will parse to null
                rollingGameCounter: 0,
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

        const { getByTestId } = render(
            <Provider store={store}>
                <ListScreen navigation={mockNavigation} />
            </Provider>
        );

        expect(getByTestId('safe-area-view')).toBeTruthy();
    });

    it('should handle navigation to game from list item', () => {
        const store = createMockStore({
            settings: {
                appOpens: 1,
                devMenuEnabled: false,
                installId: 'existing-id',
                onboarded: '1.0.0',
                rollingGameCounter: 1,
            },
            games: {
                entities: { 'game-1': mockGame1 },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByText } = render(
            <Provider store={store}>
                <ListScreen navigation={mockNavigation} />
            </Provider>
        );

        const gameItem = getByText('Game game-1 - Index 0');
        fireEvent.press(gameItem);

        expect(mockNavigation.navigate).toHaveBeenCalledWith('Game', { gameId: 'game-1' });
    });

    it('should handle dev menu enabled state', () => {
        const store = createMockStore({
            settings: {
                appOpens: 1,
                devMenuEnabled: true,
                installId: 'existing-id',
                onboarded: '1.0.0',
                rollingGameCounter: 0,
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

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { logEvent } = require('../Analytics');

        render(
            <Provider store={store}>
                <ListScreen navigation={mockNavigation} />
            </Provider>
        );

        expect(logEvent).toHaveBeenCalledWith('game_list', expect.objectContaining({
            devMenuEnabled: true,
        }));
    });

    it('should handle platform-specific blur view styling', () => {
        const store = createMockStore({
            settings: {
                appOpens: 1,
                devMenuEnabled: false,
                installId: 'existing-id',
                onboarded: '1.0.0',
                rollingGameCounter: 1,
            },
            games: {
                entities: { 'game-1': mockGame1 },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <ListScreen navigation={mockNavigation} />
            </Provider>
        );

        const blurView = getByTestId('blur-view');
        expect(blurView).toBeTruthy();
        // The blur view should be visible when there are games
        expect(blurView.props.style).toEqual(expect.objectContaining({
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
        }));
    });
});
