import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';
import { StatusBar } from 'expo-status-bar';
import { Navigation } from './src/Navigation';
import { View } from 'react-native';

export default function App() {
    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    <StatusBar />
                    <Navigation />
                </PersistGate>
            </Provider>
        </View>
    );
};
