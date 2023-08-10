import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import crashlytics from '@react-native-firebase/crashlytics';

import ListScreen from "./src/screens/ListScreen";
import GameScreen from "./src/screens/GameScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import AppInfoScreen from "./src/screens/AppInfoScreen";
import HomeHeader from './src/components/Headers/HomeHeader';
import GameHeader from './src/components/Headers/GameHeader';
import SettingsHeader from './src/components/Headers/SettingsHeader';
import AppInfoHeader from './src/components/Headers/AppInfoHeader';

const Stack = createNativeStackNavigator();

const MyTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: 'black',
    },
};

export default function App() {
    useEffect(() => {
        crashlytics().log('App mounted.');
        crashlytics().recordError(new Error('Test Error'));
    }, []);

    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <StatusBar barStyle="light-content" />
                <NavigationContainer theme={MyTheme}>
                    <Stack.Navigator>
                        <Stack.Screen name="List" component={ListScreen}
                            options={{
                                orientation: 'any',
                                title: 'Home',
                                headerTitle: 'ScorePad with Rounds',
                                header: ({ navigation }) => {
                                    return <HomeHeader navigation={navigation} />;
                                },
                            }}
                        />
                        <Stack.Screen name="Game" component={GameScreen}
                            options={{
                                orientation: 'any',
                                title: "Current Game",
                                header: ({ navigation }) => {
                                    return <GameHeader navigation={navigation} />;
                                },
                            }}
                        />
                        <Stack.Screen name="Settings" component={SettingsScreen}
                            options={{
                                orientation: 'any',
                                title: "Settings",
                                header: ({ navigation }) => {
                                    return <SettingsHeader navigation={navigation} />;
                                },
                            }}
                        />
                        <Stack.Screen name="AppInfo" component={AppInfoScreen}
                            options={{
                                orientation: 'any',
                                title: "Info",
                                header: ({ navigation }) => {
                                    return <AppInfoHeader navigation={navigation} />;
                                },
                            }}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </PersistGate>
        </Provider>
    );
}
