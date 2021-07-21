
import { createStore, combineReducers } from 'redux';
import currentGameReducer from './CurrentGameReducer';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer } from 'redux-persist';

const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
};

const rootReducer = combineReducers({
    currentGame: persistReducer(persistConfig, currentGameReducer),
})

export const store = createStore(rootReducer);
export const persistor = persistStore(store);