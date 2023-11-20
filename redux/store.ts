import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer } from 'redux-persist';
import { configureStore } from "@reduxjs/toolkit";

import settingsReducer from './SettingsSlice';
import gamesReducer from './GamesSlice';
import scoresReducer from './PlayersSlice';

const settingsPersistConfig = {
    key: 'settings',
    version: 0,
    storage: AsyncStorage,
    whitelist: [
        'home_fullscreen',
        'multiplier',
        'addendOne',
        'addendTwo',
        'currentGameId',
        'onboarded',
        'showPointParticles'
    ],
};

const gamesPersistConfig = {
    key: 'games',
    version: 0,
    storage: AsyncStorage,
    whitelist: ['entities', 'ids'],
};

const playersPersistConfig = {
    key: 'players',
    version: 0,
    storage: AsyncStorage,
    whitelist: ['entities', 'ids'],
};

export const store = configureStore({
    reducer: {
        settings: persistReducer(settingsPersistConfig, settingsReducer),
        games: persistReducer(gamesPersistConfig, gamesReducer),
        players: persistReducer(playersPersistConfig, scoresReducer),
    },
    // preloadedState: getPreloadedState(),
    middleware: getDefaultMiddleware => getDefaultMiddleware({
        serializableCheck: {
            ignoreActions: true
        },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const persistor = persistStore(store);

// exportData();
