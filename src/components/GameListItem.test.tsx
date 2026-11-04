import React from 'react';

import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { Provider } from 'react-redux';

import gamesReducer, { deleteGameAndPlayers, gameSave, roundNext } from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer from '../../redux/SettingsSlice';
import ListScreen from '../screens/ListScreen';

import GameListItem, { gameResult } from './GameListItem';

jest.mock('../Analytics', () => ({
    logEvent: jest.fn(),
}));

jest.mock('@react-navigation/elements', () => ({
    useHeaderHeight: () => 0,
}));

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useFocusEffect: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: jest.requireActual('react-native').View,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Header items are covered by the button's own tests.
jest.mock('./Buttons/AppSettingsButton', () => ({
    __esModule: true,
    default: () => null,
    useAppSettingsHeaderItems: () => [],
}));

jest.mock('../hooks/useStoreReviewPrompt', () => ({
    useStoreReviewPrompt: () => jest.fn(),
}));

jest.mock('./FloatingActionButton', () => ({
    __esModule: true,
    default: () => null,
    FAB_BOTTOM_MARGIN: 16,
    FAB_LIST_CLEARANCE: 16,
    FAB_SIZE: 60,
}));

jest.mock('react-native-reanimated', () => {
    const { FlatList, View } = jest.requireActual('react-native');

    return {
        __esModule: true,
        default: {
            View: View,
            FlatList,
        },
        FadeInUp: {
            duration: jest.fn(() => ({ delay: jest.fn() })),
        },
        LinearTransition: {
            easing: jest.fn(() => ({})),
        },
        Easing: { ease: jest.fn() },
    };
});

// Mock @rneui/base ListItem and Icon
jest.mock('@rneui/base', () => {
    const { View, Text, TouchableOpacity } = jest.requireActual('react-native');

    const ListItem = ({ children, onPress, testID }: {
        children: React.ReactNode;
        onPress?: () => void;
        testID?: string;
    }) => (
        <TouchableOpacity testID={testID} onPress={onPress}>{children}</TouchableOpacity>
    );
    ListItem.Content = ({ children }: { children: React.ReactNode }) => <View>{children}</View>;
    ListItem.Title = ({ children, style }: { children: React.ReactNode; style?: object }) => <Text style={style}>{children}</Text>;
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
    setOptions: jest.fn(),
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

    it('keeps each game as its own card as the mounted list gains and loses games', () => {
        const store = createMockStore(populatedState);
        const { queryAllByTestId, getByText, queryByText } = render(
            <Provider store={store}>
                <ListScreen navigation={mockNavigation} />
            </Provider>
        );

        act(() => {
            store.dispatch(gameSave({
                ...mockGame,
                id: 'game-2',
                title: 'Game 2',
                dateCreated: mockGame.dateCreated + 1000,
            }));
        });
        expect(getByText('Game 2')).toBeTruthy();
        expect(queryAllByTestId('game-list-item')).toHaveLength(2);
        expect(queryAllByTestId(/^game-list-separator-/)).toHaveLength(0);

        act(() => {
            store.dispatch(deleteGameAndPlayers('game-1'));
        });
        expect(queryByText('Test Game')).toBeNull();
        expect(queryAllByTestId('game-list-item')).toHaveLength(1);
    });

    it('should render the title, who leads, and the round', () => {
        const store = createMockStore(populatedState);

        const { getByText, getByTestId } = render(
            <Provider store={store}>
                <GameListItem navigation={mockNavigation} gameId="game-1" index={0} />
            </Provider>
        );

        expect(getByTestId('game-list-item')).toBeTruthy();
        expect(getByText('Test Game')).toBeTruthy();
        expect(getByTestId('game-list-result')).toHaveTextContent('Player 1 leads with 10');
        expect(getByTestId('game-list-status')).toHaveTextContent('Round 3');
    });

    it('should emphasize the game title', () => {
        const store = createMockStore(populatedState);

        const { getByText } = render(
            <Provider store={store}>
                <GameListItem navigation={mockNavigation} gameId="game-1" index={0} />
            </Provider>
        );

        expect(getByText('Test Game').props.style).toEqual(
            expect.arrayContaining([expect.objectContaining({ fontWeight: '600' })])
        );
    });

    it('leads a finished game with its winner and marks it finished', () => {
        const store = createMockStore({
            ...populatedState,
            games: {
                entities: {
                    'game-1': {
                        ...mockGame,
                        locked: true,
                        playerIds: ['player-1', 'player-2', 'player-3'],
                        winnerIds: ['player-3'],
                    },
                },
                ids: ['game-1'],
            },
            players: {
                entities: {
                    ...mockPlayers,
                    'player-3': { id: 'player-3', playerName: 'Player 3', scores: [20] },
                },
                ids: ['player-1', 'player-2', 'player-3'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <GameListItem navigation={mockNavigation} gameId="game-1" index={0} />
            </Provider>
        );

        expect(getByTestId('game-list-result')).toHaveTextContent('Player 3 won with 20');
        expect(getByTestId('icon-trophy')).toBeTruthy();
        expect(getByTestId('game-list-status')).toHaveTextContent('Finished');
    });

    describe('gameResult', () => {
        const players = [
            { id: 'a', name: 'Ann', total: 30 },
            { id: 'b', name: 'Bo', total: 12 },
            { id: 'c', name: 'Cy', total: 30 },
        ];

        it('names every winner of a tie', () => {
            expect(gameResult({ locked: true, winnerIds: ['a', 'c'], roundTotal: 4 }, players).text)
                .toBe('Ann and Cy tied with 30');
        });

        it('names tied leaders while the game is in play', () => {
            expect(gameResult({ roundTotal: 4 }, players).text).toBe('Ann and Cy tied at 30');
        });

        it('follows a lowest-score-wins rule', () => {
            expect(gameResult({ roundTotal: 2, scoring: { winner: 'low' } }, players).text)
                .toBe('Bo leads with 12');
        });

        it('says so before anyone has scored', () => {
            const unscored = players.map(p => ({ ...p, total: 0 }));
            expect(gameResult({ roundTotal: 1 }, unscored)).toEqual({ playerIds: [], text: 'No scores yet' });
        });

        it('falls back to the leader when a locked game has no winners', () => {
            expect(gameResult({ locked: true, winnerIds: [], roundTotal: 3 }, players).text)
                .toBe('Ann and Cy tied at 30');
        });
    });

    describe('created timestamp', () => {
        const renderWithDate = (dateCreated: number) => {
            const store = createMockStore({
                ...populatedState,
                games: {
                    entities: { 'game-1': { ...mockGame, dateCreated } },
                    ids: ['game-1'],
                },
            });

            return render(
                <Provider store={store}>
                    <GameListItem navigation={mockNavigation} gameId="game-1" index={0} />
                </Provider>
            );
        };

        it('stays relative under a day, where a date would only say today', () => {
            const { getByText } = renderWithDate(Date.now() - 3 * 60 * 60 * 1000);

            expect(getByText('3h ago')).toBeTruthy();
        });

        it('switches to the weekday and date once it is days old', () => {
            const threeDaysAgo = Date.now() - 3 * 86400000;
            const { getByText } = renderWithDate(threeDaysAgo);

            const expected = new Date(threeDaysAgo).toLocaleDateString(undefined, {
                weekday: 'short', month: 'short', day: 'numeric',
            });

            expect(getByText(expected)).toBeTruthy();
        });

        it('trades the weekday for the year once out of this year', () => {
            const date = new Date();
            date.setFullYear(date.getFullYear() - 2);
            const twoYearsAgo = date.getTime();

            const { getByText } = renderWithDate(twoYearsAgo);

            const expected = new Date(twoYearsAgo).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric',
            });

            expect(getByText(expected)).toBeTruthy();
        });
    });

    it('marks a locked game finished without a lock icon', () => {
        const store = createMockStore({
            ...populatedState,
            games: {
                entities: { 'game-1': { ...mockGame, locked: true } },
                ids: ['game-1'],
            },
        });

        const { getByTestId, queryByTestId } = render(
            <Provider store={store}>
                <GameListItem navigation={mockNavigation} gameId="game-1" index={0} />
            </Provider>
        );

        expect(getByTestId('game-list-status')).toHaveTextContent('Finished');
        expect(queryByTestId('icon-lock-closed-outline')).toBeNull();
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
