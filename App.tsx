import React, { useCallback, useState } from 'react';

import analytics from '@react-native-firebase/analytics';
import * as SplashScreen from 'expo-splash-screen';
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
import { SplashOverlay } from './src/components/SplashOverlay';
import { Navigation } from './src/Navigation';
import { useTheme } from './src/theme';

// Keep the native splash screen up until our animated SplashOverlay mounts and
// calls hideAsync(). Without this, Expo auto-hides the native splash on first JS
// frame — before the UI/persisted state is ready — causing the black flash.
SplashScreen.preventAutoHideAsync();

if (process.env.EXPO_PUBLIC_FIREBASE_ANALYTICS == 'false') {
    analytics().setAnalyticsCollectionEnabled(false);
}

const AppContent = () => {
    const theme = useTheme();
    const [appReady, setAppReady] = useState(false);
    const [splashDone, setSplashDone] = useState(false);
    const handleBeforeLift = useCallback(() => setAppReady(true), []);
    const handleSplashDone = useCallback(() => setSplashDone(true), []);

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <SafeAreaProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <GameSheetContextProvider>
                        <MenuProvider>
                            <PointValuesSheetContextProvider>
                                <ChooseWinnersSheetContextProvider>
                                    <PersistGate
                                        loading={null}
                                        onBeforeLift={handleBeforeLift}
                                        persistor={persistor}
                                    >
                                        <StatusBar />
                                        <Navigation />
                                    </PersistGate>
                                </ChooseWinnersSheetContextProvider>
                            </PointValuesSheetContextProvider>
                        </MenuProvider>
                    </GameSheetContextProvider>
                </GestureHandlerRootView>
            </SafeAreaProvider>
            {!splashDone && (
                <SplashOverlay
                    backgroundColor={theme.background}
                    onDone={handleSplashDone}
                    ready={appReady}
                />
            )}
        </View>
    );
};

export default function App() {
    return (
        <Provider store={store}>
            <AppContent />
        </Provider>
    );
};
