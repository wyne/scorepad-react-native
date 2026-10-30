import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer, { updateGame } from '../../../redux/GamesSlice';
import playersReducer from '../../../redux/PlayersSlice';
import { ScoringRules } from '../../../redux/ScoringRules';
import settingsReducer, { initialState as initialSettings } from '../../../redux/SettingsSlice';

import RoundHeaderTitle from './RoundHeaderTitle';

jest.mock('../../Analytics', () => ({
    logEvent: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    notificationAsync: jest.fn(),
    selectionAsync: jest.fn(),
    ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
    NotificationFeedbackType: { Success: 'success' },
}));

jest.mock('expo-glass-effect', () => ({
    isLiquidGlassAvailable: () => false,
    GlassView: ({ children }: { children: React.ReactNode }) => {
        const { View } = jest.requireActual('react-native');
        return <View>{children}</View>;
    },
}));

jest.mock('@react-native-menu/menu', () => ({
    MenuView: ({ children }: { children: React.ReactNode }) => {
        const { View } = jest.requireActual('react-native');
        return <View>{children}</View>;
    },
}));

jest.mock('react-native-elements/dist/icons/Icon', () => ({
    Icon: () => null,
}));

const mockPresent = jest.fn();
jest.mock('../Sheets/GameOverSheetContext', () => ({
    useGameOverSheetContext: jest.fn(() => ({ current: { present: mockPresent, close: jest.fn() } })),
}));

const mockSnapToIndex = jest.fn();
jest.mock('../Sheets/GameSheetContext', () => ({
    gameSheetExpandedIndex: 2,
    useGameSheetContext: () => ({ current: { snapToIndex: mockSnapToIndex } }),
}));

const mockHideLockedHint = jest.fn();
let mockLockedHintVisible = false;
jest.mock('../LockedHintContext', () => ({
    useLockedHint: () => ({ lockedHintVisible: mockLockedHintVisible, showLockedHint: jest.fn(), hideLockedHint: mockHideLockedHint }),
}));

const createStore = (roundCurrent: number, roundTotal: number, scoring?: ScoringRules, scores = [10, 10, 10]) => configureStore({
    reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
    preloadedState: {
        settings: { ...initialSettings, currentGameId: 'game-1' },
        games: {
            ids: ['game-1'],
            entities: {
                'game-1': {
                    id: 'game-1',
                    title: 'Game 1',
                    dateCreated: 0,
                    roundCurrent,
                    roundTotal,
                    playerIds: ['player-1'],
                    ...(scoring ? { scoring } : {}),
                },
            },
        },
        players: {
            ids: ['player-1'],
            entities: { 'player-1': { id: 'player-1', playerName: 'Player 1', scores } },
        },
    },
});

const renderTitle = (store: ReturnType<typeof createStore>) => render(
    <Provider store={store}><RoundHeaderTitle /></Provider>
);

describe('RoundHeaderTitle', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockLockedHintVisible = false;
    });

    const lock = (store: ReturnType<typeof createStore>) => {
        store.dispatch(updateGame({ id: 'game-1', changes: { locked: true } }));
        return store;
    };

    it('opens the game sheet to unlock when Final is tapped', () => {
        const { getByTestId, getByText } = renderTitle(lock(createStore(2, 3)));

        expect(getByText('Final')).toBeTruthy();
        fireEvent.press(getByTestId('final-pill'));

        expect(mockSnapToIndex).toHaveBeenCalledWith(2);
        expect(mockHideLockedHint).toHaveBeenCalled();
    });

    it('does not offer the Final pill while the game is unlocked', () => {
        const { queryByTestId } = renderTitle(createStore(2, 3));

        expect(queryByTestId('final-pill')).toBeNull();
    });

    it('counts rounds played so far without a round limit', () => {
        const { getByText } = renderTitle(createStore(1, 3));

        expect(getByText('2 of 3')).toBeTruthy();
    });

    it('counts toward the round limit', () => {
        const { getByText } = renderTitle(createStore(1, 2, { winner: 'high', end: { type: 'rounds', rounds: 9 } }));

        expect(getByText('2 of 9')).toBeTruthy();
    });

    it('counts past the limit once play goes on', () => {
        const { getByText } = renderTitle(createStore(10, 11, { winner: 'high', end: { type: 'rounds', rounds: 9 } }));

        expect(getByText('11 of 11')).toBeTruthy();
    });

    it('starts the next round while the game is not over', () => {
        const store = createStore(1, 2, { winner: 'high', end: { type: 'rounds', rounds: 9 } });
        const { getByTestId } = renderTitle(store);

        fireEvent.press(getByTestId('next-round-button'));

        expect(mockPresent).not.toHaveBeenCalled();
        expect(store.getState().games.entities['game-1']?.roundCurrent).toBe(2);
    });

    it('offers to end the game instead of starting a round past the limit', () => {
        const store = createStore(2, 3, { winner: 'high', end: { type: 'rounds', rounds: 3 } });
        const { getByTestId } = renderTitle(store);

        fireEvent.press(getByTestId('next-round-button'));

        expect(mockPresent).toHaveBeenCalled();
        expect(store.getState().games.entities['game-1']?.roundCurrent).toBe(2);
    });

    it('offers to end the game once someone reaches the target', () => {
        const store = createStore(2, 3, { winner: 'low', end: { type: 'target', target: 30 } });
        const { getByTestId } = renderTitle(store);

        fireEvent.press(getByTestId('next-round-button'));

        expect(mockPresent).toHaveBeenCalled();
    });
});
