import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer } from 'redux-persist';
import { configureStore } from "@reduxjs/toolkit";

import currentGameReducer from './CurrentGameSlice';
import settingsReducer from './SettingsSlice';
import createMigrate from 'redux-persist/es/createMigrate';
import 'react-native-get-random-values';

const migrations = {
    // 0: (state) => {
    // const players = state.players
    // return {
    //     ...state,
    //     players: [
    //         { name: 'player 1', uuid: uuidv4() },
    //         { name: 'player 2', uuid: uuidv4() },
    //     ],
    // }
    // }
}

const currentGamePersistConfig = {
    key: 'root',
    version: 0,
    storage: AsyncStorage,
    whitelist: ['players', 'scores', 'currentRound',],
    migrate: createMigrate(migrations, { debug: true }),
};

const settingsPersistConfig = {
    key: 'settings',
    version: 0,
    storage: AsyncStorage,
    whitelist: ['home_fullscreen', 'multiplier'],
};

export const store = configureStore({
    reducer: {
        currentGame: persistReducer(currentGamePersistConfig, currentGameReducer),
        settings: persistReducer(settingsPersistConfig, settingsReducer),
    }
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

export const persistor = persistStore(store);
