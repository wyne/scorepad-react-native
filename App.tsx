import React from 'react';

// Imported first for its side effect: Sentry.init must run before other modules
// (store creation, firebase) so their errors are captured.
// eslint-disable-next-line import/order
import Sentry from './src/sentry';

import analytics from '@react-native-firebase/analytics';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MenuProvider } from 'react-native-popup-menu';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

// AnimatedTextInput uses `defaultValue={sv.value}` for initial render (harmless one-time read).
// Disable strict mode to suppress the false-positive "reading value during render" warning.
configureReanimatedLogger({ level: ReanimatedLogLevel.warn, strict: false });

import { persistor, store } from './redux/store';
import { ChooseWinnersSheetContextProvider } from './src/components/Sheets/ChooseWinnersSheetContext';
import { GameSheetContextProvider } from './src/components/Sheets/GameSheetContext';
import { PointValuesSheetContextProvider } from './src/components/Sheets/PointValuesSheetContext';
import { Navigation } from './src/Navigation';

if (process.env.EXPO_PUBLIC_FIREBASE_ANALYTICS == 'false') {
    analytics().setAnalyticsCollectionEnabled(false);
}

function App() {
    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <SafeAreaProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <Provider store={store}>
                        <GameSheetContextProvider>
                            <MenuProvider>
                                <PointValuesSheetContextProvider>
                                    <ChooseWinnersSheetContextProvider>
                                    <PersistGate loading={null} persistor={persistor}>
                                        <StatusBar />
                                        <Navigation />
                                    </PersistGate>
                                    </ChooseWinnersSheetContextProvider>
                                </PointValuesSheetContextProvider>
                            </MenuProvider>
                        </GameSheetContextProvider>
                    </Provider>
                </GestureHandlerRootView>
            </SafeAreaProvider>
        </View>
    );
}

export default Sentry.wrap(App);
