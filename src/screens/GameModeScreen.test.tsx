import React from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import { ScoringRules } from '../../redux/ScoringRules';
import settingsReducer, { initialState as initialSettings } from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';

import GameModeScreen, { presetDescription } from './GameModeScreen';

jest.mock('../Analytics', () => ({
    logEvent: jest.fn(),
}));

jest.mock('react-native-elements', () => {
    const { Text } = jest.requireActual('react-native');
    return {
        Icon: ({ name }: { name: string; }) => <Text>{name}</Text>,
    };
});

const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
} as unknown as NativeStackNavigationProp<ParamListBase, string, undefined>;

const createStore = (scores: number[], scoring?: ScoringRules) => configureStore({
    reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
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
    <Provider store={store}><GameModeScreen navigation={mockNavigation} /></Provider>
);

const scoring = (store: ReturnType<typeof createStore>) => store.getState().games.entities['game-1']?.scoring;

describe('GameModeScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('describes each preset by how it ends', () => {
        expect(presetDescription({ winner: 'low', end: { type: 'target', target: 100 } })).toBe('Ends when anyone reaches 100');
        expect(presetDescription({ winner: 'high', end: { type: 'target', target: 10000 } })).toBe('First to 10,000');
        expect(presetDescription({ winner: 'low', end: { type: 'rounds', rounds: 9 } })).toBe('9 rounds');
        expect(presetDescription({ winner: 'low' })).toBe('Lowest wins');
    });

    it('marks free play for a game without rules', () => {
        const { getByTestId } = renderScreen(createStore([0]));

        expect(getByTestId('game-mode-free-play').props.accessibilityState).toEqual({ selected: true });
        expect(getByTestId('game-mode-hearts').props.accessibilityState).toEqual({ selected: false });
    });

    it('copies a preset\'s rules into the game and goes back', () => {
        const store = createStore([0]);
        const { getByTestId } = renderScreen(store);

        fireEvent.press(getByTestId('game-mode-golf'));

        expect(scoring(store)).toEqual({ winner: 'low', end: { type: 'rounds', rounds: 9 }, name: 'Golf' });
        expect(mockNavigation.goBack).toHaveBeenCalled();
        expect(logEvent).toHaveBeenCalledWith('set_game_mode', { game_id: 'game-1', mode: 'golf', mid_game: false });
    });

    it('marks the preset the game uses', () => {
        const { getByTestId } = renderScreen(createStore([0], { winner: 'high', end: { type: 'rounds', rounds: 13 }, name: 'Yahtzee' }));

        expect(getByTestId('game-mode-yahtzee').props.accessibilityState).toEqual({ selected: true });
        expect(getByTestId('game-mode-free-play').props.accessibilityState).toEqual({ selected: false });
    });

    it('goes back to free play', () => {
        const store = createStore([0], { winner: 'low', name: 'Golf' });
        const { getByTestId } = renderScreen(store);

        fireEvent.press(getByTestId('game-mode-free-play'));

        expect(scoring(store)).toBeUndefined();
    });

    it('warns before switching games mid-game', () => {
        const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
        const store = createStore([5]);
        const { getByTestId } = renderScreen(store);

        fireEvent.press(getByTestId('game-mode-hearts'));

        expect(alertSpy).toHaveBeenCalledWith(
            'Change rules mid-game?',
            expect.stringContaining('Switching to Hearts'),
            expect.any(Array),
        );
        expect(scoring(store)).toBeUndefined();

        const buttons = alertSpy.mock.calls[0][2] as { text: string; onPress?: () => void; }[];
        buttons.find(button => button.text === 'Change Rules')?.onPress?.();

        expect(scoring(store)?.name).toBe('Hearts');
    });

    it('filters presets by search and says when none match', () => {
        const { getByTestId, queryByTestId } = renderScreen(createStore([0]));

        fireEvent.changeText(getByTestId('game-mode-search'), 'far');
        expect(getByTestId('game-mode-farkle')).toBeTruthy();
        expect(queryByTestId('game-mode-hearts')).toBeNull();
        expect(queryByTestId('game-mode-free-play')).toBeNull();

        fireEvent.changeText(getByTestId('game-mode-search'), 'canasta');
        expect(getByTestId('game-mode-no-results')).toBeTruthy();
        expect(getByTestId('game-mode-custom')).toBeTruthy();
    });

    it('opens custom rules and marks hand-made rules as custom', () => {
        const { getByTestId, getByText } = renderScreen(createStore([0], { winner: 'low', end: { type: 'rounds', rounds: 4 } }));

        expect(getByText('Lowest score wins · 4 rounds')).toBeTruthy();
        expect(getByTestId('game-mode-free-play').props.accessibilityState).toEqual({ selected: false });

        fireEvent.press(getByTestId('game-mode-custom'));
        expect(mockNavigation.navigate).toHaveBeenCalledWith('ScoringRules');
    });
});
