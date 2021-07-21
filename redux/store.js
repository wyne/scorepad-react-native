
import { createStore, combineReducers } from 'redux';
import playersReducer from '../store/reducers/Players';
import scoresReducer from '../store/reducers/ScoresReducer';
import currentGameReducer from './CurrentGameReducer';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer } from 'redux-persist';

const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
    // whitelist: ['bookmarks']
};

const rootReducer = combineReducers({
    currentGame: persistReducer(persistConfig, currentGameReducer),
    players: persistReducer(persistConfig, playersReducer),
    scores: scoresReducer,
})

export const store = createStore(rootReducer);
export const persistor = persistStore(store);