import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer } from 'redux-persist';
import { configureStore } from "@reduxjs/toolkit";

import currentGameReducer from './CurrentGameSlice';
import settingsReducer from './SettingsSlice';
import gameListReducer from './GameListSlice';
import createMigrate from 'redux-persist/es/createMigrate';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const migrations = {
    1: (state) => {
        return {
            ...state,
            uuid: uuidv4(),
            dateCreated: Date.now(),
        }
    },
}

const currentGamePersistConfig = {
    key: 'root',
    version: 1,
    storage: AsyncStorage,
    whitelist: ['uuid', 'players', 'scores', 'currentRound',],
    migrate: createMigrate(migrations, { debug: false }),
};

const settingsPersistConfig = {
    key: 'settings',
    version: 0,
    storage: AsyncStorage,
    whitelist: ['home_fullscreen', 'multiplier'],
};

const gameListPersistConfig = {
    key: 'games',
    version: 0,
    storage: AsyncStorage,
    whitelist: ['entities', 'ids'],
};

export const store = configureStore({
    reducer: {
        currentGame: persistReducer(currentGamePersistConfig, currentGameReducer),
        settings: persistReducer(settingsPersistConfig, settingsReducer),
        games: persistReducer(gameListPersistConfig, gameListReducer),
    }
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

export const persistor = persistStore(store);
