import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';

import gamesReducer from './GamesSlice';
import { gamesPersistConfig } from './store';

jest.mock('@react-native-firebase/analytics', () => () => ({ logEvent: jest.fn() }));

const game = (id: string, locked: boolean) => ({
    id,
    title: id,
    dateCreated: 0,
    playerIds: [],
    roundCurrent: 1,
    roundTotal: 4,
    locked,
});

const rehydrateGames = async (version: number) => {
    await AsyncStorage.clear();
    const saved = {
        entities: { locked: game('locked', true), open: game('open', false) },
        ids: ['locked', 'open'],
        _persist: { version, rehydrated: true },
    };
    const serialized = Object.fromEntries(
        Object.entries(saved).map(([key, value]) => [key, JSON.stringify(value)])
    );
    await AsyncStorage.setItem('persist:games', JSON.stringify(serialized));

    const store = configureStore({
        reducer: persistReducer(gamesPersistConfig, gamesReducer),
        middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
    });
    await new Promise<void>(resolve => {
        const persistor = persistStore(store, null, () => resolve());
        persistor.pause();
    });
    return store.getState();
};

describe('games migrations', () => {
    it('moves games locked on an earlier round to their last round', async () => {
        const state = await rehydrateGames(0);
        expect(state.entities.locked?.roundCurrent).toBe(3);
        expect(state.entities.open?.roundCurrent).toBe(1);
    });
});
