import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, within } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../../redux/GamesSlice';
import playersReducer from '../../../redux/PlayersSlice';
import settingsReducer from '../../../redux/SettingsSlice';
import { logEvent } from '../../Analytics';

import ChooseWinnersSheet from './ChooseWinnersSheet';

jest.mock('../../Analytics', () => ({
    logEvent: jest.fn(),
}));

jest.mock('expo-blur', () => {
    const { View } = jest.requireActual('react-native');
    return {
        BlurView: ({ children, style }: { children?: React.ReactNode; style?: object }) => (
            <View style={style}>{children}</View>
        ),
    };
});

jest.mock('@gorhom/bottom-sheet', () => {
    const { forwardRef, useImperativeHandle } = jest.requireActual('react');
    const { View, ScrollView } = jest.requireActual('react-native');

    const MockBottomSheetModal = forwardRef((props: { children: React.ReactNode }, ref: React.Ref<{ present: () => void; close: () => void; dismiss: () => void }>) => {
        useImperativeHandle(ref, () => ({
            present: jest.fn(),
            close: jest.fn(),
            dismiss: jest.fn(),
        }));
        return <View testID="bottom-sheet-modal">{props.children}</View>;
    });

    const MockBottomSheetScrollView = ({ children, contentContainerStyle }: { children: React.ReactNode; contentContainerStyle?: object }) => (
        <ScrollView contentContainerStyle={contentContainerStyle}>{children}</ScrollView>
    );

    return {
        __esModule: true,
        default: MockBottomSheetModal,
        BottomSheetModal: MockBottomSheetModal,
        BottomSheetScrollView: MockBottomSheetScrollView,
        BottomSheetBackdrop: () => <View testID="bottom-sheet-backdrop" />,
    };
});

jest.mock('./ChooseWinnersSheetContext', () => ({
    useChooseWinnersSheetContext: jest.fn(() => ({
        current: {
            present: jest.fn(),
            close: jest.fn(),
            dismiss: jest.fn(),
        },
    })),
}));

jest.mock('react-native-elements', () => {
    const { View, Text } = jest.requireActual('react-native');
    return {
        Icon: ({ name, color, style }: { name: string; color: string; style?: object }) => (
            <View testID={`icon-${name}`} style={style}>
                <Text style={{ color }}>{name}</Text>
            </View>
        ),
    };
});

jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: ({ children }: { children: React.ReactNode }) => {
        const { View } = jest.requireActual('react-native');
        return <View>{children}</View>;
    },
    useSafeAreaInsets: jest.fn(() => ({ top: 50, bottom: 34, left: 0, right: 0 })),
}));

describe('ChooseWinnersSheet', () => {
    const createMockStore = (
        players: Record<string, { id: string; playerName: string; scores: number[] }>,
        gameId?: string,
        playerIds?: string[],
    ) => {
        return configureStore({
            reducer: {
                settings: settingsReducer,
                games: gamesReducer,
                players: playersReducer,
            },
            preloadedState: {
                settings: { currentGameId: gameId || 'game-1' },
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
            } as Parameters<typeof configureStore>[0]['preloadedState'],
        });
    };

    // Bob(15) > Alice(10) > Charlie(8) — verifies sort order
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
        const { getByText } = render(<Provider store={store}><ChooseWinnersSheet /></Provider>);

        expect(getByText('Alice')).toBeTruthy();
        expect(getByText('Bob')).toBeTruthy();
        expect(getByText('Charlie')).toBeTruthy();
    });

    it('should show the sheet title', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);
        const { getByText } = render(<Provider store={store}><ChooseWinnersSheet /></Provider>);

        expect(getByText('Choose Winner(s)')).toBeTruthy();
    });

    it('should sort players by total score descending', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);
        const { getAllByTestId } = render(<Provider store={store}><ChooseWinnersSheet /></Provider>);

        const rows = getAllByTestId(/^winner-player-row-\d+$/);
        expect(within(rows[0]).getByText('Bob')).toBeTruthy();    // 15
        expect(within(rows[1]).getByText('Alice')).toBeTruthy();  // 10
        expect(within(rows[2]).getByText('Charlie')).toBeTruthy(); // 8
    });

    it('should display total scores for each player', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);
        const { getByText } = render(<Provider store={store}><ChooseWinnersSheet /></Provider>);

        expect(getByText('15')).toBeTruthy();
        expect(getByText('10')).toBeTruthy();
        expect(getByText('8')).toBeTruthy();
    });

    it('should toggle player selection on press', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);
        const { getByText, getAllByTestId, queryAllByTestId } = render(<Provider store={store}><ChooseWinnersSheet /></Provider>);

        expect(queryAllByTestId('icon-checkmark-circle').length).toBe(0);
        expect(getAllByTestId('icon-ellipse-outline').length).toBe(3);

        fireEvent.press(getByText('Alice'));

        expect(getAllByTestId('icon-checkmark-circle').length).toBe(1);
        expect(getAllByTestId('icon-ellipse-outline').length).toBe(2);
    });

    it('should deselect a player on second press', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);
        const { getByText, getAllByTestId, queryAllByTestId } = render(<Provider store={store}><ChooseWinnersSheet /></Provider>);

        fireEvent.press(getByText('Alice'));
        expect(getAllByTestId('icon-checkmark-circle').length).toBe(1);

        fireEvent.press(getByText('Alice'));
        expect(queryAllByTestId('icon-checkmark-circle').length).toBe(0);
        expect(getAllByTestId('icon-ellipse-outline').length).toBe(3);
    });

    it('should allow selecting multiple players', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);
        const { getByText, getAllByTestId } = render(<Provider store={store}><ChooseWinnersSheet /></Provider>);

        fireEvent.press(getByText('Alice'));
        fireEvent.press(getByText('Bob'));

        expect(getAllByTestId('icon-checkmark-circle').length).toBe(2);
        expect(getAllByTestId('icon-ellipse-outline').length).toBe(1);
    });

    it('should render Cancel and Lock Game buttons', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);
        const { getByLabelText } = render(<Provider store={store}><ChooseWinnersSheet /></Provider>);

        expect(getByLabelText('Cancel')).toBeTruthy();
        expect(getByLabelText('Lock Game')).toBeTruthy();
    });

    it('should clear selection when Cancel is pressed', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);
        const { getByText, getByLabelText, getAllByTestId, queryAllByTestId } = render(<Provider store={store}><ChooseWinnersSheet /></Provider>);

        fireEvent.press(getByText('Alice'));
        expect(getAllByTestId('icon-checkmark-circle').length).toBe(1);

        fireEvent.press(getByLabelText('Cancel'));

        expect(queryAllByTestId('icon-checkmark-circle').length).toBe(0);
        expect(getAllByTestId('icon-ellipse-outline').length).toBe(3);
    });

    it('should dispatch lock action with selected winners', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);
        const { getByText, getByLabelText } = render(<Provider store={store}><ChooseWinnersSheet /></Provider>);

        fireEvent.press(getByText('Alice'));
        fireEvent.press(getByLabelText('Lock Game'));

        const game = store.getState().games.entities['game-1'];
        expect(game?.locked).toBe(true);
        expect(game?.winnerIds).toEqual(['player-1']);
    });

    it('should lock game with no winners when none selected', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);
        const { getByLabelText } = render(<Provider store={store}><ChooseWinnersSheet /></Provider>);

        fireEvent.press(getByLabelText('Lock Game'));

        const game = store.getState().games.entities['game-1'];
        expect(game?.locked).toBe(true);
        expect(game?.winnerIds).toEqual([]);
    });

    it('should clear selection after locking', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);
        const { getByText, getByLabelText, getAllByTestId, queryAllByTestId } = render(<Provider store={store}><ChooseWinnersSheet /></Provider>);

        fireEvent.press(getByText('Alice'));
        expect(getAllByTestId('icon-checkmark-circle').length).toBe(1);

        fireEvent.press(getByLabelText('Lock Game'));

        expect(queryAllByTestId('icon-checkmark-circle').length).toBe(0);
        expect(getAllByTestId('icon-ellipse-outline').length).toBe(3);
    });

    it('should log analytics event with correct winner count when locking', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);
        const { getByText, getByLabelText } = render(<Provider store={store}><ChooseWinnersSheet /></Provider>);

        fireEvent.press(getByText('Alice'));
        fireEvent.press(getByText('Bob'));
        fireEvent.press(getByLabelText('Lock Game'));

        expect(logEvent).toHaveBeenCalledWith('lock_game', {
            game_id: 'game-1',
            locked: true,
            winner_count: 2,
        });
    });

    it('should log analytics event with zero winners when locking with none selected', () => {
        const store = createMockStore(mockPlayers, 'game-1', ['player-1', 'player-2', 'player-3']);
        const { getByLabelText } = render(<Provider store={store}><ChooseWinnersSheet /></Provider>);

        fireEvent.press(getByLabelText('Lock Game'));

        expect(logEvent).toHaveBeenCalledWith('lock_game', {
            game_id: 'game-1',
            locked: true,
            winner_count: 0,
        });
    });
});
