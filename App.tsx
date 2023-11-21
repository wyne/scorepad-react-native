import React from 'react';

import analytics from '@react-native-firebase/analytics';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from './redux/store';
import { AddendModalContextProvider } from './src/components/Sheets/AddendModalContext';
import { GameSheetContextProvider } from './src/components/Sheets/GameSheetContext';
import { Navigation } from './src/Navigation';

if (process.env.EXPO_PUBLIC_FIREBASE_ANALYTICS == "false") {
    analytics().setAnalyticsCollectionEnabled(false);
}

export default function App() {
    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <GameSheetContextProvider>
                    <AddendModalContextProvider>
                        <Provider store={store}>
                            <PersistGate loading={null} persistor={persistor}>
                                <StatusBar />
                                <Navigation />
                            </PersistGate>
                        </Provider>
                    </AddendModalContextProvider>
                </GameSheetContextProvider>
            </GestureHandlerRootView>
        </View>
    );
};
