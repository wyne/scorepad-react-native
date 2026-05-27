import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, createMigrate } from 'redux-persist';

import gamesReducer from './GamesSlice';
import scoresReducer from './PlayersSlice';
import settingsReducer from './SettingsSlice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const settingsMigrations: any = {
    0: (state: Record<string, unknown> | undefined) => {
        const s: Record<string, unknown> = state ?? {};
        const keepScreenAwake = (s.keepScreenAwakeDuration as number ?? 0) > 0;
        delete s.keepScreenAwakeDuration;
        return { ...s, keepScreenAwake, seenFeatureNotifications: [] };
    },
    1: (state: Record<string, unknown> | undefined) => {
        return { ...state, colorScheme: 'system' };
    },
};

const settingsPersistConfig = {
    key: 'settings',
    version: 2,
    storage: AsyncStorage,
    migrate: createMigrate(settingsMigrations),
    whitelist: [
        'home_fullscreen',
        'multiplier',
        'addendOne',
        'addendTwo',
        'currentGameId',
        'onboarded',
        'showPointParticles',
        'showPlayerIndex',
        'interactionType',
        'lastStoreReviewPrompt',
        'devMenuEnabled',
        'appOpens',
        'installId',
        'rollingGameCounter',
        'keepScreenAwake',
        'seenFeatureNotifications',
        'colorScheme',
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
export interface RootState {
    settings: ReturnType<typeof settingsReducer>;
    games: ReturnType<typeof gamesReducer>;
    players: ReturnType<typeof scoresReducer>;
}

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export const persistor = persistStore(store);

// exportData();
