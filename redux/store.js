import { createStore, combineReducers } from 'redux';
import currentGameReducer from './CurrentGameReducer';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer } from 'redux-persist';
import createMigrate from 'redux-persist/es/createMigrate';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

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

const persistConfig = {
    key: 'root',
    version: '0',
    storage: AsyncStorage,
    whitelist: ['players', 'scores', 'currentRound',],
    migrate: createMigrate(migrations, { debug: true }),
};

const rootReducer = combineReducers({
    currentGame: persistReducer(persistConfig, currentGameReducer),
})

export const store = createStore(rootReducer);
export const persistor = persistStore(store);