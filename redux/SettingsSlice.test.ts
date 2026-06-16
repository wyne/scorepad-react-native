import { configureStore } from '@reduxjs/toolkit';
import { Store } from 'redux';

import { InteractionType } from '../src/components/Interactions/InteractionType';

import settingsReducer, {
    setCurrentGameId,
    setLastUsedInteractionType,
    setMultiplier,
    SettingsState } from './SettingsSlice';


describe('settings reducer', () => {
    let store: Store<SettingsState>;

    beforeEach(() => {
        store = configureStore({ reducer: settingsReducer });
    });

    it('should handle setCurrentGameId', () => {
        const gameId = '123';
        store.dispatch(setCurrentGameId(gameId));
        expect(store.getState().currentGameId).toEqual(gameId);
    });

    it('should handle setMultiplier', () => {
        const multiplier = 2;
        store.dispatch(setMultiplier(multiplier));
        expect(store.getState().multiplier).toEqual(multiplier);
    });

    it('should handle setLastUsedInteractionType', () => {
        expect(store.getState().lastUsedInteractionType).toBeUndefined();
        store.dispatch(setLastUsedInteractionType(InteractionType.Dial));
        expect(store.getState().lastUsedInteractionType).toEqual(InteractionType.Dial);
    });

    it('no-ops setLastUsedInteractionType when the value is unchanged', () => {
        store.dispatch(setLastUsedInteractionType(InteractionType.HalfTap));
        const before = store.getState();
        store.dispatch(setLastUsedInteractionType(InteractionType.HalfTap));
        // Equality guard means the state object reference is unchanged.
        expect(store.getState()).toBe(before);
    });

});
