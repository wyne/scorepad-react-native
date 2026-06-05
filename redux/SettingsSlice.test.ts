import { configureStore } from '@reduxjs/toolkit';
import { Store } from 'redux';

import settingsReducer, {
    setCurrentGameId,
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

});
