import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer, { playerRoundScoreSet } from '../../redux/PlayersSlice';
import settingsReducer, { setInteractionType } from '../../redux/SettingsSlice';
import { InteractionType } from '../components/Interactions/InteractionType';

import { useGestureHint } from './useGestureHint';

const createStore = (scores: number[] = [0]) =>
    configureStore({
        reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
        preloadedState: {
            settings: { currentGameId: 'game-1', interactionType: InteractionType.SwipeVertical },
            games: {
                entities: {
                    'game-1': { id: 'game-1', playerIds: ['p1'], dateCreated: 0, roundCurrent: 0, roundTotal: 1, locked: false },
                },
                ids: ['game-1'],
            },
            players: {
                entities: { p1: { id: 'p1', playerName: 'P1', scores } },
                ids: ['p1'],
            },
        } as Parameters<typeof configureStore>[0]['preloadedState'],
    });

const wrap = (store: ReturnType<typeof createStore>) =>
    ({ children }: { children: React.ReactNode }) =>
        React.createElement(Provider, { store }, children);

describe('useGestureHint', () => {
    // req 1: new game with no scores → show hint
    it('shows hint on new game with zero scores', () => {
        const store = createStore([0]);
        const { result } = renderHook(() => useGestureHint(), { wrapper: wrap(store) });
        expect(result.current).toBe(true);
    });

    // req 5: reopen game with existing scores → hide hint immediately (no flash)
    it('hides hint immediately when game already has scores', () => {
        const store = createStore([5]);
        const { result } = renderHook(() => useGestureHint(), { wrapper: wrap(store) });
        expect(result.current).toBe(false);
    });

    // req 2: score change → hide hint
    it('hides hint when a score is added', () => {
        const store = createStore([0]);
        const { result } = renderHook(() => useGestureHint(), { wrapper: wrap(store) });
        expect(result.current).toBe(true);

        act(() => { store.dispatch(playerRoundScoreSet('p1', 0, 5)); });
        expect(result.current).toBe(false);
    });

    // req 3: gesture change → re-enable hint
    it('re-shows hint when gesture type changes', () => {
        const store = createStore([5]); // starts dismissed
        const { result } = renderHook(() => useGestureHint(), { wrapper: wrap(store) });
        expect(result.current).toBe(false);

        act(() => { store.dispatch(setInteractionType(InteractionType.HalfTap)); });
        expect(result.current).toBe(true);
    });

    // req 4: score after gesture change → hide again
    it('hides hint again after scoring with the new gesture', () => {
        const store = createStore([5]); // starts dismissed
        const { result } = renderHook(() => useGestureHint(), { wrapper: wrap(store) });

        act(() => { store.dispatch(setInteractionType(InteractionType.HalfTap)); });
        expect(result.current).toBe(true);

        act(() => { store.dispatch(playerRoundScoreSet('p1', 0, 10)); }); // fingerprint increases 5→10
        expect(result.current).toBe(false);
    });

    it('hides hint when the game is locked', () => {
        const store = configureStore({
            reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
            preloadedState: {
                settings: { currentGameId: 'game-1', interactionType: InteractionType.SwipeVertical },
                games: {
                    entities: {
                        'game-1': { id: 'game-1', playerIds: ['p1'], dateCreated: 0, roundCurrent: 0, roundTotal: 1, locked: true },
                    },
                    ids: ['game-1'],
                },
                players: { entities: { p1: { id: 'p1', playerName: 'P1', scores: [0] } }, ids: ['p1'] },
            } as Parameters<typeof configureStore>[0]['preloadedState'],
        });
        const { result } = renderHook(() => useGestureHint(), { wrapper: wrap(store) });
        expect(result.current).toBe(false);
    });
});
