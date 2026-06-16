import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer, { setLastUsedInteractionType } from '../../redux/SettingsSlice';
import { InteractionType } from '../components/Interactions/InteractionType';

import { useGestureHint } from './useGestureHint';

interface StoreOpts {
    /** Global gesture (the per-game fallback). Resolves the "current" gesture. */
    interactionType?: InteractionType;
    /** Per-game gesture override on game-1. */
    gameInteractionType?: InteractionType;
    /** The gesture the user last *used*. undefined = new user. */
    lastUsed?: InteractionType;
    locked?: boolean;
}

const createStore = (opts: StoreOpts = {}) =>
    configureStore({
        reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
        preloadedState: {
            settings: {
                currentGameId: 'game-1',
                interactionType: opts.interactionType ?? InteractionType.SwipeVertical,
                lastUsedInteractionType: opts.lastUsed,
            },
            games: {
                entities: {
                    'game-1': {
                        id: 'game-1', playerIds: ['p1'], dateCreated: 0, roundCurrent: 0, roundTotal: 1,
                        locked: opts.locked ?? false, interactionType: opts.gameInteractionType,
                    },
                },
                ids: ['game-1'],
            },
            players: {
                entities: { p1: { id: 'p1', playerName: 'P1', scores: [0] } },
                ids: ['p1'],
            },
        } as Parameters<typeof configureStore>[0]['preloadedState'],
    });

const wrap = (store: ReturnType<typeof createStore>) =>
    ({ children }: { children: React.ReactNode }) =>
        React.createElement(Provider, { store, children });

describe('useGestureHint', () => {
    // New user: never used a gesture → show the hint.
    it('shows hint when there is no last-used gesture', () => {
        const store = createStore({ lastUsed: undefined });
        const { result } = renderHook(() => useGestureHint(), { wrapper: wrap(store) });
        expect(result.current).toBe(true);
    });

    // The current gesture has already been used → no hint (covers reopen with scores).
    it('hides hint when the current gesture matches the last-used gesture', () => {
        const store = createStore({ interactionType: InteractionType.SwipeVertical, lastUsed: InteractionType.SwipeVertical });
        const { result } = renderHook(() => useGestureHint(), { wrapper: wrap(store) });
        expect(result.current).toBe(false);
    });

    // Active gesture differs from the last-used one (gesture switched) → show hint.
    it('shows hint when the current gesture differs from the last-used gesture', () => {
        const store = createStore({ interactionType: InteractionType.HalfTap, lastUsed: InteractionType.SwipeVertical });
        const { result } = renderHook(() => useGestureHint(), { wrapper: wrap(store) });
        expect(result.current).toBe(true);
    });

    // Using the gesture (marking it last-used) dismisses the hint.
    it('hides hint once the current gesture is used', () => {
        const store = createStore({ interactionType: InteractionType.HalfTap, lastUsed: InteractionType.SwipeVertical });
        const { result } = renderHook(() => useGestureHint(), { wrapper: wrap(store) });
        expect(result.current).toBe(true);

        act(() => { store.dispatch(setLastUsedInteractionType(InteractionType.HalfTap)); });
        expect(result.current).toBe(false);
    });

    // Opening a game whose per-game gesture differs from the last-used one shows the
    // hint — the "this game's mode is different" cue.
    it('shows hint when a game uses a per-game gesture the user has not last used', () => {
        const store = createStore({ lastUsed: InteractionType.SwipeVertical, gameInteractionType: InteractionType.Dial });
        const { result } = renderHook(() => useGestureHint(), { wrapper: wrap(store) });
        expect(result.current).toBe(true);
    });

    it('hides hint when the game is locked even if gestures differ', () => {
        const store = createStore({ interactionType: InteractionType.HalfTap, lastUsed: InteractionType.SwipeVertical, locked: true });
        const { result } = renderHook(() => useGestureHint(), { wrapper: wrap(store) });
        expect(result.current).toBe(false);
    });
});
