import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
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

const createStore = (scores: number[], scoring?: { winner: 'high' | 'low'; }) => configureStore({
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
            mid_game: true,
        });
    });
});
