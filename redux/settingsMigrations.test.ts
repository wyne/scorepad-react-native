import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';

import { FEATURE_NOTIFICATIONS } from '../src/constants';

import settingsReducer from './SettingsSlice';
import { settingsPersistConfig } from './store';

const rehydrateSettings = async (saved?: Record<string, unknown>) => {
    await AsyncStorage.clear();
    if (saved) {
        const serialized = Object.fromEntries(
            Object.entries(saved).map(([key, value]) => [key, JSON.stringify(value)])
        );
        await AsyncStorage.setItem('persist:settings', JSON.stringify(serialized));
    }

    const store = configureStore({
        reducer: persistReducer(settingsPersistConfig, settingsReducer),
        middleware: getDefaultMiddleware => getDefaultMiddleware({ serializableCheck: false }),
    });
    await new Promise<void>(resolve => {
        const persistor = persistStore(store, null, () => resolve());
        persistor.pause();
    });
    return store.getState();
};

describe('settings migrations', () => {
    it('marks every feature notification seen on a fresh install', async () => {
        const state = await rehydrateSettings();
        expect(state.seenFeatureNotifications).toEqual(FEATURE_NOTIFICATIONS);
    });

    it.each([0, 4])('keeps badges for version %i saves without a notification list', async version => {
        const state = await rehydrateSettings({ appOpens: 7, _persist: { version, rehydrated: true } });
        expect(state.appOpens).toBe(7);
        expect(state.seenFeatureNotifications).toEqual([]);
    });

    it('preserves the saved notification list on upgrade', async () => {
        const state = await rehydrateSettings({
            seenFeatureNotifications: ['keep_screen_awake'],
            _persist: { version: 4, rehydrated: true },
        });
        expect(state.seenFeatureNotifications).toEqual(['keep_screen_awake']);
    });
});
