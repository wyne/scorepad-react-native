import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer, { markInteractionLearned, setLastUsedInteractionType } from '../../redux/SettingsSlice';
import { InteractionType } from '../components/Interactions/InteractionType';

import { useGestureHint } from './useGestureHint';

interface StoreOpts {
    /** Global gesture (the per-game fallback). Resolves the "current" gesture. */
    interactionType?: InteractionType;
    /** Per-game gesture override on game-1. */
    gameInteractionType?: InteractionType;
    /** Gestures the user has learned. Empty = new user. */
    learned?: InteractionType[];
    locked?: boolean;
}

const createStore = (opts: StoreOpts = {}) =>
    configureStore({
        reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
        preloadedState: {
            settings: {
                currentGameId: 'game-1',
                interactionType: opts.interactionType ?? InteractionType.SwipeVertical,
                learnedInteractionTypes: opts.learned ?? [],
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
    const hint = (store: ReturnType<typeof createStore>) =>
        renderHook(() => useGestureHint(), { wrapper: wrap(store) }).result;

    it('shows hint to a new user', () => {
        expect(hint(createStore()).current).toBe(true);
    });

    it('hides hint for a learned gesture', () => {
        expect(hint(createStore({ learned: [InteractionType.SwipeVertical] })).current).toBe(false);
    });

    it('shows hint for a gesture not learned yet', () => {
        expect(hint(createStore({ interactionType: InteractionType.HalfTap, learned: [InteractionType.SwipeVertical] })).current).toBe(true);
    });

    it('hides hint once the current gesture is used', () => {
        const store = createStore({ interactionType: InteractionType.HalfTap, learned: [InteractionType.SwipeVertical] });
        const result = hint(store);
        expect(result.current).toBe(true);
        act(() => { store.dispatch(setLastUsedInteractionType(InteractionType.HalfTap)); });
        expect(result.current).toBe(false);
    });

    it('hides hint once dismissed', () => {
        const store = createStore();
        const result = hint(store);
        act(() => { store.dispatch(markInteractionLearned(InteractionType.SwipeVertical)); });
        expect(result.current).toBe(false);
    });

    // Switching between games with different gestures: both already learned,
    // even though only one is the last used.
    it('hides hint for a per-game gesture learned earlier, whatever was used last', () => {
        const store = createStore({ gameInteractionType: InteractionType.Dial, learned: [InteractionType.Dial, InteractionType.SwipeVertical] });
        act(() => { store.dispatch(setLastUsedInteractionType(InteractionType.SwipeVertical)); });
        expect(hint(store).current).toBe(false);
    });

    it('shows hint for a per-game gesture not learned yet', () => {
        expect(hint(createStore({ learned: [InteractionType.SwipeVertical], gameInteractionType: InteractionType.Dial })).current).toBe(true);
    });

    it('hides hint when the game is locked', () => {
        expect(hint(createStore({ interactionType: InteractionType.HalfTap, locked: true })).current).toBe(false);
    });
});
