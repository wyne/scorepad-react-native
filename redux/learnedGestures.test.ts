import { configureStore } from '@reduxjs/toolkit';

import { InteractionType } from '../src/components/Interactions/InteractionType';

import gamesReducer from './GamesSlice';
import playersReducer from './PlayersSlice';
import settingsReducer, { initialState as settingsInitialState, SettingsState } from './SettingsSlice';
import { AppStore, backfillLearnedGestures } from './store';

jest.mock('@react-native-async-storage/async-storage', () =>
    jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const game = (id: string, playerIds: string[], interactionType?: InteractionType) => ({
    id, title: id, dateCreated: 0, roundCurrent: 0, roundTotal: 1, locked: false, playerIds, interactionType,
});

const createStore = (settings: Partial<SettingsState>) => configureStore({
    reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
    preloadedState: {
        settings: { ...settingsInitialState, interactionType: InteractionType.SwipeVertical, ...settings },
        games: {
            ids: ['played-dial', 'played-default', 'unplayed-tap'],
            entities: {
                'played-dial': game('played-dial', ['a'], InteractionType.Dial),
                'played-default': game('played-default', ['b']),
                'unplayed-tap': game('unplayed-tap', ['c'], InteractionType.HalfTap),
            },
        },
        players: {
            ids: ['a', 'b', 'c'],
            entities: {
                a: { id: 'a', playerName: 'A', scores: [5] },
                b: { id: 'b', playerName: 'B', scores: [0, -2] },
                c: { id: 'c', playerName: 'C', scores: [0] },
            },
        },
    } as Parameters<typeof configureStore>[0]['preloadedState'],
}) as unknown as AppStore;

describe('backfillLearnedGestures', () => {
    it('marks the gestures of every played game and the last one used as learned', () => {
        const store = createStore({ learnedInteractionTypes: undefined, lastUsedInteractionType: InteractionType.HalfTap });
        backfillLearnedGestures(store);
        expect([...store.getState().settings.learnedInteractionTypes ?? []].sort()).toEqual(
            [InteractionType.Dial, InteractionType.HalfTap, InteractionType.SwipeVertical].sort(),
        );
    });

    it('skips games without a score', () => {
        const store = createStore({ learnedInteractionTypes: undefined });
        backfillLearnedGestures(store);
        expect(store.getState().settings.learnedInteractionTypes).not.toContain(InteractionType.HalfTap);
    });

    it('leaves an existing learned list alone', () => {
        const store = createStore({ learnedInteractionTypes: [InteractionType.Dial] });
        backfillLearnedGestures(store);
        expect(store.getState().settings.learnedInteractionTypes).toEqual([InteractionType.Dial]);
    });
});
