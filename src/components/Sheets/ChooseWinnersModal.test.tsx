import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../../redux/GamesSlice';
import playersReducer from '../../../redux/PlayersSlice';
import settingsReducer from '../../../redux/SettingsSlice';

import ChooseWinnersModal from './ChooseWinnersModal';

// Mock Analytics
jest.mock('../../Analytics', () => ({
    logEvent: jest.fn(),
}));

// Mock @gorhom/bottom-sheet
jest.mock('@gorhom/bottom-sheet', () => {
    const { forwardRef, useImperativeHandle } = jest.requireActual('react');
    const RN = jest.requireActual('react-native');
    const View = RN.View;

    const MockBottomSheetModal = forwardRef((props: {
        children: React.ReactNode;
        index?: number;
        snapPoints?: (string | number)[];
        backdropComponent?: React.ComponentType;
        backgroundStyle?: object;
        handleIndicatorStyle?: object;
        enablePanDownToClose?: boolean;
        enableContentPanningGesture?: boolean;
    }, ref: React.Ref<{ present: () => void; close: () => void; dismiss: () => void }>) => {
        useImperativeHandle(ref, () => ({
            present: jest.fn(),
            close: jest.fn(),
            dismiss: jest.fn(),
        }));

        return (
            <View testID="bottom-sheet-modal">
                {props.children}
            </View>
        );
    });

    const MockBottomSheetScrollView = ({ children, style, contentContainerStyle }: {
        children: React.ReactNode;
        style?: object;
        contentContainerStyle?: object;
    }) => (
        <RN.ScrollView style={style} contentContainerStyle={contentContainerStyle}>
            {children}
        </RN.ScrollView>
    );

    const MockBottomSheetBackdrop = () => <View testID="bottom-sheet-backdrop" />;

    return {
        __esModule: true,
        default: MockBottomSheetModal,
        BottomSheetModal: MockBottomSheetModal,
        BottomSheetScrollView: MockBottomSheetScrollView,
        BottomSheetBackdrop: MockBottomSheetBackdrop,
    };
});

// Mock ChooseWinnersModalContext
jest.mock('./ChooseWinnersModalContext', () => ({
    useChooseWinnersModalContext: jest.fn(() => ({
        current: {
            present: jest.fn(),
            close: jest.fn(),
            dismiss: jest.fn(),
        },
    })),
}));

// Mock react-native-elements Icon
jest.mock('react-native-elements', () => {
    const { View, Text } = jest.requireActual('react-native');

    return {
        Icon: ({ name, color, style }: {
            name: string;
            color: string;
            style?: object;
        }) => (
            <View testID={`icon-${name}`} style={style}>
                <Text style={{ color }}>{name}</Text>
            </View>
        ),
    };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: ({ children }: { children: React.ReactNode }) => {
        const { View } = jest.requireActual('react-native');
        return <View>{children}</View>;
    },
    useSafeAreaInsets: jest.fn(() => ({ top: 50, bottom: 34, left: 0, right: 0 })),
}));

describe('ChooseWinnersModal', () => {
    const createMockStore = (
        players: Record<string, { id: string; playerName: string; scores: number[]; }>,
        gameId?: string,
        playerIds?: string[],
    ) => {
        const initialState: Parameters<typeof configureStore>[0]['preloadedState'] = {
            settings: {
                currentGameId: gameId || 'game-1',
            },
            games: {
                entities: gameId ? {
                    [gameId]: {
                        id: gameId,
                        title: 'Test Game',
                        dateCreated: Date.now(),
                        roundCurrent: 0,
                        roundTotal: 1,
                        playerIds: playerIds || [],
                        locked: false,
                        winnerIds: [],
                    },
                } : {},
                ids: gameId ? [gameId] : [],
            },
            players: {
                entities: players,
                ids: Object.keys(players),
            },
        };

        return configureStore({
            reducer: {
                settings: settingsReducer,
                games: gamesReducer,
                players: playersReducer,
            },
            preloadedState: initialState,
        });
    };

    const mockPlayers = {
        'player-1': { id: 'player-1', playerName: 'Alice', scores: [10] },
        'player-2': { id: 'player-2', playerName: 'Bob', scores: [15] },
        'player-3': { id: 'player-3', playerName: 'Charlie', scores: [8] },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render player names', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);

        const { getByText } = render(
            <Provider store={store}>
                <ChooseWinnersModal />
            </Provider>
        );

        expect(getByText('Alice')).toBeTruthy();
        expect(getByText('Bob')).toBeTruthy();
        expect(getByText('Charlie')).toBeTruthy();
    });

    it('should show the modal title', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);

        const { getByText } = render(
            <Provider store={store}>
                <ChooseWinnersModal />
            </Provider>
        );

        expect(getByText('Choose Winner(s)')).toBeTruthy();
    });

    it('should toggle player selection on press', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);

        const { getByText, getAllByTestId, queryAllByTestId } = render(
            <Provider store={store}>
                <ChooseWinnersModal />
            </Provider>
        );

        expect(queryAllByTestId('icon-trophy').length).toBe(0);
        expect(getAllByTestId('icon-trophy-outline').length).toBe(3);

        fireEvent.press(getByText('Alice'));

        expect(getAllByTestId('icon-trophy').length).toBe(1);
        expect(getAllByTestId('icon-trophy-outline').length).toBe(2);
    });

    it('should deselect a player on second press', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);

        const { getByText, getAllByTestId, queryAllByTestId } = render(
            <Provider store={store}>
                <ChooseWinnersModal />
            </Provider>
        );

        fireEvent.press(getByText('Alice'));
        expect(getAllByTestId('icon-trophy').length).toBe(1);
        expect(getAllByTestId('icon-trophy-outline').length).toBe(2);

        fireEvent.press(getByText('Alice'));
        expect(queryAllByTestId('icon-trophy').length).toBe(0);
        expect(getAllByTestId('icon-trophy-outline').length).toBe(3);
    });

    it('should select multiple players', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);

        const { getByText, getAllByTestId } = render(
            <Provider store={store}>
                <ChooseWinnersModal />
            </Provider>
        );

        fireEvent.press(getByText('Alice'));
        fireEvent.press(getByText('Bob'));

        expect(getAllByTestId('icon-trophy').length).toBe(2);
        expect(getAllByTestId('icon-trophy-outline').length).toBe(1);
    });

    it('should render Cancel and Lock Game buttons', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);

        const { getByText } = render(
            <Provider store={store}>
                <ChooseWinnersModal />
            </Provider>
        );

        expect(getByText('Cancel')).toBeTruthy();
        expect(getByText('Lock Game')).toBeTruthy();
    });

    it('should close modal when Cancel is pressed', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);

        const { getByText } = render(
            <Provider store={store}>
                <ChooseWinnersModal />
            </Provider>
        );

        fireEvent.press(getByText('Cancel'));

        expect(getByText('Choose Winner(s)')).toBeTruthy();
    });

    it('should dispatch lock action when Lock Game is pressed', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);

        const { getByText } = render(
            <Provider store={store}>
                <ChooseWinnersModal />
            </Provider>
        );

        // Select Alice
        fireEvent.press(getByText('Alice'));

        // Press Lock Game
        fireEvent.press(getByText('Lock Game'));

        // Check that the game was locked with winners
        const state = store.getState();
        const game = state.games.entities['game-1'];
        expect(game?.locked).toBe(true);
        expect(game?.winnerIds).toEqual(['player-1']);
    });

    it('should lock game without winners when no player selected', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);

        const { getByText } = render(
            <Provider store={store}>
                <ChooseWinnersModal />
            </Provider>
        );

        fireEvent.press(getByText('Lock Game'));

        const state = store.getState();
        const game = state.games.entities['game-1'];
        expect(game?.locked).toBe(true);
        expect(game?.winnerIds).toEqual([]);
    });
});
