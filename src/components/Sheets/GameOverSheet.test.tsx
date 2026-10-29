import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../../redux/GamesSlice';
import playersReducer from '../../../redux/PlayersSlice';
import { ScoringRules } from '../../../redux/ScoringRules';
import settingsReducer, { initialState as initialSettings } from '../../../redux/SettingsSlice';
import { logEvent } from '../../Analytics';

import GameOverSheet from './GameOverSheet';

jest.mock('../../Analytics', () => ({
    logEvent: jest.fn(),
}));

jest.mock('@gorhom/bottom-sheet', () => {
    const { View, ScrollView } = jest.requireActual('react-native');

    const MockBottomSheetModal = (props: { children: React.ReactNode }) => (
        <View testID="bottom-sheet-modal">{props.children}</View>
    );

    return {
        __esModule: true,
        default: MockBottomSheetModal,
        BottomSheetModal: MockBottomSheetModal,
        BottomSheetScrollView: ({ children }: { children: React.ReactNode }) => <ScrollView>{children}</ScrollView>,
        BottomSheetBackdrop: () => <View testID="bottom-sheet-backdrop" />,
    };
});

const mockClose = jest.fn();
jest.mock('./GameOverSheetContext', () => ({
    useGameOverSheetContext: jest.fn(() => ({ current: { present: jest.fn(), close: mockClose } })),
}));

jest.mock('react-native-elements', () => {
    const { Text } = jest.requireActual('react-native');
    return {
        Icon: ({ name }: { name: string }) => <Text>{name}</Text>,
    };
});

jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: ({ children }: { children: React.ReactNode }) => {
        const { View } = jest.requireActual('react-native');
        return <View>{children}</View>;
    },
    useSafeAreaInsets: jest.fn(() => ({ top: 50, bottom: 34, left: 0, right: 0 })),
}));

const createStore = (scores: Record<string, number[]>, scoring: ScoringRules, roundTotal = 1) => {
    const names: Record<string, string> = { a: 'Justin', b: 'Sam', c: 'Alex', d: 'Riley' };
    const ids = Object.keys(scores);
    return configureStore({
        reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
        preloadedState: {
            settings: { ...initialSettings, currentGameId: 'game-1' },
            games: {
                ids: ['game-1'],
                entities: {
                    'game-1': {
                        id: 'game-1',
                        title: 'Hearts',
                        dateCreated: 0,
                        roundCurrent: roundTotal - 1,
                        roundTotal,
                        playerIds: ids,
                        locked: false,
                        winnerIds: [],
                        scoring,
                    },
                },
            },
            players: {
                ids,
                entities: Object.fromEntries(ids.map(id => [id, { id, playerName: names[id], scores: scores[id] }])),
            },
        },
    });
};

const renderSheet = (store: ReturnType<typeof createStore>) => render(
    <Provider store={store}><GameOverSheet /></Provider>
);

const game = (store: ReturnType<typeof createStore>) => store.getState().games.entities['game-1'];

describe('GameOverSheet', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows nothing while the game is not over', () => {
        const store = createStore({ a: [10], b: [20] }, { winner: 'high', end: { type: 'rounds', rounds: 3 } });
        const { queryByTestId } = renderSheet(store);

        expect(queryByTestId('game-over-sheet')).toBeNull();
    });

    it('names who reached the target and ranks by the rule', () => {
        const store = createStore(
            { a: [64], b: [104], c: [70], d: [88] },
            { winner: 'low', end: { type: 'target', target: 100 } },
        );
        const { getByTestId, getAllByTestId } = renderSheet(store);

        expect(getByTestId('game-over-headline').props.children).toBe('Sam reached 104');
        expect(getByTestId('game-over-rule').props.children).toBe('Lowest score wins.');
        expect(getAllByTestId(/^game-over-row-/).map(row => row.props.testID)).toEqual([
            'game-over-row-a', 'game-over-row-c', 'game-over-row-d', 'game-over-row-b',
        ]);
    });

    it('ends the game with the leader as the winner', () => {
        const store = createStore({ a: [30, 20], b: [10, 5] }, { winner: 'high', end: { type: 'rounds', rounds: 2 } }, 2);
        const { getByTestId } = renderSheet(store);

        expect(getByTestId('game-over-headline').props.children).toBe('2 rounds played');
        fireEvent.press(getByTestId('game-over-end'));

        expect(game(store)?.locked).toBe(true);
        expect(game(store)?.winnerIds).toEqual(['a']);
        expect(mockClose).toHaveBeenCalled();
        expect(logEvent).toHaveBeenCalledWith('game_over', {
            game_id: 'game-1', action: 'end', reason: 'rounds', tied: false,
        });
    });

    it('lets every tied leader win by default', () => {
        const store = createStore(
            { a: [64], b: [104], c: [64] },
            { winner: 'low', end: { type: 'target', target: 100 } },
        );
        const { getByTestId } = renderSheet(store);

        expect(getByTestId('game-over-rule').props.children).toBe('Lowest score wins. It\'s a tie.');
        expect(getByTestId('game-over-tie-all')).toHaveTextContent('Both win');
        fireEvent.press(getByTestId('game-over-end'));

        expect(game(store)?.winnerIds).toEqual(['a', 'c']);
    });

    it('breaks a tie with a picked winner', () => {
        const store = createStore(
            { a: [64], b: [104], c: [64] },
            { winner: 'low', end: { type: 'target', target: 100 } },
        );
        const { getByTestId } = renderSheet(store);

        fireEvent.press(getByTestId('game-over-tie-pick'));
        fireEvent.press(getByTestId('game-over-end'));
        expect(game(store)?.locked).toBe(false);

        fireEvent.press(getByTestId('game-over-row-c'));
        fireEvent.press(getByTestId('game-over-end'));
        expect(game(store)?.locked).toBe(true);
        expect(game(store)?.winnerIds).toEqual(['c']);
    });

    it('keeps playing into a new round', () => {
        const store = createStore({ a: [30, 20], b: [10, 5] }, { winner: 'high', end: { type: 'rounds', rounds: 2 } }, 2);
        const { getByTestId } = renderSheet(store);

        fireEvent.press(getByTestId('game-over-keep-playing'));

        expect(game(store)?.locked).toBe(false);
        expect(game(store)?.roundCurrent).toBe(2);
        expect(game(store)?.roundTotal).toBe(3);
        expect(mockClose).toHaveBeenCalled();
    });
});
