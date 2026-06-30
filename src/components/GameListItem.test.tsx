import React from 'react';

import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { Provider } from 'react-redux';

import gamesReducer, { deleteGameAndPlayers, roundNext } from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer from '../../redux/SettingsSlice';

import GameListItem from './GameListItem';

jest.mock('../Analytics', () => ({
    logEvent: jest.fn(),
}));

jest.mock('react-native-reanimated', () => {
    const View = jest.requireActual('react-native').View;

    return {
        __esModule: true,
        default: {
            View: View,
        },
        FadeInUp: {
            duration: jest.fn(() => ({ delay: jest.fn() })),
        },
    };
});

// Mock react-native-elements ListItem and Icon
jest.mock('react-native-elements', () => {
    const { View, Text, TouchableOpacity } = jest.requireActual('react-native');

    const ListItem = ({ children, onPress, testID }: {
        children: React.ReactNode;
        onPress?: () => void;
        testID?: string;
    }) => (
        <TouchableOpacity testID={testID} onPress={onPress}>{children}</TouchableOpacity>
    );
    ListItem.Content = ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
    ListItem.Title = ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>;
    ListItem.Subtitle = ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>;
    ListItem.Chevron = () => <View testID="chevron" />;

    return {
        ListItem,
        Icon: ({ name }: { name: string }) => <View testID={`icon-${name}`} />,
    };
});

// Capture ContextMenu props so tests can trigger menu actions (iOS popup menu)
const mockContextMenuProps: {
    current: {
        onPress?: (event: { nativeEvent: { index: number } }) => void;
        onPreviewPress?: () => void;
        title?: string;
    } | null;
} = { current: null };

jest.mock('react-native-context-menu-view', () => {
    const { View } = jest.requireActual('react-native');

    return {
        __esModule: true,
        default: (props: {
            children: React.ReactNode;
            onPress?: (event: { nativeEvent: { index: number } }) => void;
            onPreviewPress?: () => void;
            title?: string;
        }) => {
            mockContextMenuProps.current = props;
            return <View testID="context-menu">{props.children}</View>;
        },
    };
});

jest.spyOn(Alert, 'alert');

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
} as unknown as NativeStackNavigationProp<ParamListBase, string, undefined>;

describe('GameListItem', () => {
    const mockGame = {
        id: 'game-1',
        title: 'Test Game',
        dateCreated: Date.now(),
        roundCurrent: 1,
        roundTotal: 3,
        playerIds: ['player-1', 'player-2'],
        locked: false,
    };

    const mockPlayers = {
        'player-1': { id: 'player-1', playerName: 'Player 1', scores: [10] },
        'player-2': { id: 'player-2', playerName: 'Player 2', scores: [5] },
    };

    const populatedState = {
        settings: {},
        games: {
            entities: { 'game-1': mockGame },
            ids: ['game-1'],
        },
        players: {
            entities: mockPlayers,
            ids: ['player-1', 'player-2'],
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockContextMenuProps.current = null;
    });

    it('should render game title, players, and badges for a valid game', () => {
        const store = createMockStore(populatedState);

        const { getByText, getByTestId } = render(
            <Provider store={store}>
                <GameListItem navigation={mockNavigation} gameId="game-1" index={0} />
            </Provider>
        );

        expect(getByTestId('game-list-item')).toBeTruthy();
        expect(getByText('Test Game')).toBeTruthy();
        expect(getByText('Player 1, ')).toBeTruthy();
        expect(getByText('Player 2')).toBeTruthy();
    });

    it('should show lock icon when game is locked', () => {
        const store = createMockStore({
            ...populatedState,
            games: {
                entities: { 'game-1': { ...mockGame, locked: true } },
                ids: ['game-1'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <GameListItem navigation={mockNavigation} gameId="game-1" index={0} />
            </Provider>
        );

        expect(getByTestId('icon-lock-closed-outline')).toBeTruthy();
    });

    it('should render null when the game is not in the store', () => {
        const store = createMockStore(populatedState);

        const { toJSON } = render(
            <Provider store={store}>
                <GameListItem navigation={mockNavigation} gameId="missing-game" index={0} />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render null without crashing when the game is deleted after mount', () => {
        const store = createMockStore(populatedState);

        const { getByText, toJSON } = render(
            <Provider store={store}>
                <GameListItem navigation={mockNavigation} gameId="game-1" index={0} />
            </Provider>
        );

        expect(getByText('Test Game')).toBeTruthy();

        act(() => {
            store.dispatch(deleteGameAndPlayers('game-1'));
        });

        expect(toJSON()).toBeNull();
    });

    it('should set current game and navigate to Game when pressed', () => {
        const store = createMockStore(populatedState);

        const { getByTestId } = render(
            <Provider store={store}>
                <GameListItem navigation={mockNavigation} gameId="game-1" index={0} />
            </Provider>
        );

        fireEvent.press(getByTestId('game-list-item'));

        expect(mockNavigation.navigate).toHaveBeenCalledWith('Game');
        expect(store.getState().settings.currentGameId).toBe('game-1');
    });

    it('should show delete confirmation when delete is chosen from the popup menu', () => {
        const store = createMockStore(populatedState);

        render(
            <Provider store={store}>
                <GameListItem navigation={mockNavigation} gameId="game-1" index={0} />
            </Provider>
        );

        expect(mockContextMenuProps.current?.title).toBe('Test Game');

        act(() => {
            mockContextMenuProps.current?.onPress?.({ nativeEvent: { index: 3 } });
        });

        expect(Alert.alert).toHaveBeenCalledWith(
            'Delete Game',
            'Are you sure you want to delete Test Game?',
            expect.arrayContaining([
                expect.objectContaining({ text: 'Cancel' }),
                expect.objectContaining({ text: 'OK' }),
            ]),
            { cancelable: false },
        );
    });

    it('does not re-render when only roundCurrent changes', () => {
        const store = createMockStore(populatedState);
        const onMenuRender = jest.fn();
        const onRender = jest.fn();

        render(
            <Provider store={store}>
                <GameListItem navigation={mockNavigation} gameId="game-1" index={0} onMenuRender={onMenuRender} onRender={onRender} />
            </Provider>
        );

        expect(onMenuRender).toHaveBeenCalledTimes(1);
        expect(onRender).toHaveBeenCalledTimes(1);
        onMenuRender.mockClear();
        onRender.mockClear();

        act(() => {
            store.dispatch(roundNext('game-1'));
        });

        expect(onMenuRender).not.toHaveBeenCalled();
        expect(onRender).not.toHaveBeenCalled();
    });
});
