import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import { ScoringRules } from '../../redux/ScoringRules';
import settingsReducer, { initialState as initialSettings } from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';

import ScoringRulesScreen from './ScoringRulesScreen';

jest.mock('../Analytics', () => ({
    logEvent: jest.fn(),
}));

jest.mock('react-native-elements', () => {
    const { Text } = jest.requireActual('react-native');
    return {
        Icon: ({ name }: { name: string; }) => <Text>{name}</Text>,
    };
});

const createStore = (scores: number[], scoring?: ScoringRules) => configureStore({
    reducer: {
        settings: settingsReducer,
        games: gamesReducer,
        players: playersReducer,
    },
    preloadedState: {
        settings: { ...initialSettings, currentGameId: 'game-1', gameModesEnabled: true },
        games: {
            ids: ['game-1'],
            entities: {
                'game-1': {
                    id: 'game-1',
                    title: 'Game 1',
                    dateCreated: 0,
                    roundCurrent: 0,
                    roundTotal: 1,
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

const renderScreen = (store: ReturnType<typeof createStore>) => render(
    <Provider store={store}>
        <ScoringRulesScreen />
    </Provider>
);

describe('ScoringRulesScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows highest score as the rule for a free play game', () => {
        const { getByTestId } = renderScreen(createStore([0]));

        expect(getByTestId('scoring-winner-high').props.accessibilityState).toEqual({ selected: true });
        expect(getByTestId('scoring-winner-low').props.accessibilityState).toEqual({ selected: false });
    });

    it('changes the rule right away before anyone has scored', () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        const store = createStore([0]);
        const { getByTestId } = renderScreen(store);

        fireEvent.press(getByTestId('scoring-winner-low'));

        expect(alertSpy).not.toHaveBeenCalled();
        expect(store.getState().games.entities['game-1']?.scoring).toEqual({ winner: 'low' });
        expect(logEvent).toHaveBeenCalledWith('set_game_scoring', {
            game_id: 'game-1',
            winner: 'low',
            end: 'none',
            mid_game: false,
        });
    });

    it('saves the default rule on a free play game without a warning', () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        const store = createStore([5]);
        const { getByTestId } = renderScreen(store);

        fireEvent.press(getByTestId('scoring-winner-high'));

        expect(alertSpy).not.toHaveBeenCalled();
        expect(store.getState().games.entities['game-1']?.scoring).toEqual({ winner: 'high' });
    });

    it('warns before changing the rule mid-game and keeps it when cancelled', () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
        const store = createStore([5], { winner: 'high' });
        const { getByTestId } = renderScreen(store);

        fireEvent.press(getByTestId('scoring-winner-low'));

        expect(alertSpy).toHaveBeenCalledWith(
            'Change rules mid-game?',
            expect.stringContaining('lowest total will win'),
            expect.any(Array),
        );
        expect(store.getState().games.entities['game-1']?.scoring).toEqual({ winner: 'high' });
    });

    it('changes the rule mid-game once confirmed', () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
        const store = createStore([5], { winner: 'high' });
        const { getByTestId } = renderScreen(store);

        fireEvent.press(getByTestId('scoring-winner-low'));
        const buttons = alertSpy.mock.calls[0][2] as { text: string; onPress?: () => void; }[];
        buttons.find(button => button.text === 'Change Rules')?.onPress?.();

        expect(store.getState().games.entities['game-1']?.scoring).toEqual({ winner: 'low' });
        expect(logEvent).toHaveBeenCalledWith('set_game_scoring', {
            game_id: 'game-1',
            winner: 'low',
            end: 'none',
            mid_game: true,
        });
    });

    describe('game ends', () => {
        const confirm = (alertSpy: jest.SpyInstance) => {
            const buttons = alertSpy.mock.calls[alertSpy.mock.calls.length - 1][2] as { text: string; onPress?: () => void; }[];
            act(() => buttons.find(button => button.text === 'Change Rules')?.onPress?.());
        };

        it('defaults to never, with no value to edit', () => {
            const { getByTestId, queryByTestId } = renderScreen(createStore([0]));

            expect(getByTestId('scoring-end-none').props.accessibilityState).toEqual({ selected: true });
            expect(queryByTestId('scoring-end-value')).toBeNull();
        });

        it('sets a round limit of 10 and a target of 100 to start', () => {
            const store = createStore([0], { winner: 'low' });
            const { getByTestId } = renderScreen(store);

            fireEvent.press(getByTestId('scoring-end-rounds'));
            expect(store.getState().games.entities['game-1']?.scoring).toEqual({
                winner: 'low',
                end: { type: 'rounds', rounds: 10 },
            });
            expect(getByTestId('scoring-end-value').props.value).toBe('10');

            fireEvent.press(getByTestId('scoring-end-target'));
            expect(store.getState().games.entities['game-1']?.scoring).toEqual({
                winner: 'low',
                end: { type: 'target', target: 100 },
            });
            expect(getByTestId('scoring-end-footnote').props.children).toContain('reaches 100');

            fireEvent.press(getByTestId('scoring-end-none'));
            expect(store.getState().games.entities['game-1']?.scoring).toEqual({ winner: 'low' });
        });

        it('keeps the end condition when the winner changes', () => {
            const store = createStore([0], { winner: 'high', end: { type: 'rounds', rounds: 9 } });
            const { getByTestId } = renderScreen(store);

            fireEvent.press(getByTestId('scoring-winner-low'));

            expect(store.getState().games.entities['game-1']?.scoring).toEqual({
                winner: 'low',
                end: { type: 'rounds', rounds: 9 },
            });
        });

        it('steps the limit and commits a typed value within bounds', () => {
            const store = createStore([0], { winner: 'high', end: { type: 'rounds', rounds: 2 } });
            const { getByTestId } = renderScreen(store);
            const end = () => store.getState().games.entities['game-1']?.scoring?.end;

            fireEvent.press(getByTestId('scoring-end-increase'));
            expect(end()).toEqual({ type: 'rounds', rounds: 3 });

            fireEvent.press(getByTestId('scoring-end-decrease'));
            fireEvent.press(getByTestId('scoring-end-decrease'));
            fireEvent.press(getByTestId('scoring-end-decrease'));
            expect(end()).toEqual({ type: 'rounds', rounds: 1 });

            fireEvent.changeText(getByTestId('scoring-end-value'), '12');
            fireEvent(getByTestId('scoring-end-value'), 'endEditing');
            expect(end()).toEqual({ type: 'rounds', rounds: 12 });

            fireEvent.changeText(getByTestId('scoring-end-value'), '');
            fireEvent(getByTestId('scoring-end-value'), 'endEditing');
            expect(end()).toEqual({ type: 'rounds', rounds: 12 });
            expect(getByTestId('scoring-end-value').props.value).toBe('12');
        });

        it('steps a target score by 10', () => {
            const store = createStore([0], { winner: 'high', end: { type: 'target', target: 100 } });
            const { getByTestId } = renderScreen(store);

            fireEvent.press(getByTestId('scoring-end-increase'));

            expect(store.getState().games.entities['game-1']?.scoring?.end).toEqual({ type: 'target', target: 110 });
        });

        it('warns once mid-game, then lets the value be adjusted', () => {
            const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
            const store = createStore([5], { winner: 'high', end: { type: 'rounds', rounds: 9 } });
            const { getByTestId } = renderScreen(store);
            const end = () => store.getState().games.entities['game-1']?.scoring?.end;

            fireEvent.press(getByTestId('scoring-end-increase'));
            expect(alertSpy).toHaveBeenCalledWith(
                'Change rules mid-game?',
                expect.stringContaining('end it sooner or later'),
                expect.any(Array),
            );
            expect(end()).toEqual({ type: 'rounds', rounds: 9 });

            confirm(alertSpy);
            expect(end()).toEqual({ type: 'rounds', rounds: 10 });

            fireEvent.press(getByTestId('scoring-end-increase'));
            expect(alertSpy).toHaveBeenCalledTimes(1);
            expect(end()).toEqual({ type: 'rounds', rounds: 11 });
        });

        it('puts the typed value back when a mid-game change is cancelled', () => {
            const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
            const store = createStore([5], { winner: 'high', end: { type: 'rounds', rounds: 9 } });
            const { getByTestId } = renderScreen(store);

            fireEvent.changeText(getByTestId('scoring-end-value'), '4');
            fireEvent(getByTestId('scoring-end-value'), 'endEditing');
            const buttons = alertSpy.mock.calls[0][2] as { text: string; onPress?: () => void; }[];
            act(() => buttons.find(button => button.text === 'Keep Current Rules')?.onPress?.());

            expect(store.getState().games.entities['game-1']?.scoring?.end).toEqual({ type: 'rounds', rounds: 9 });
            expect(getByTestId('scoring-end-value').props.value).toBe('9');
        });
    });
});
