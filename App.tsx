import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';

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
    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    <StatusBar />
                    <NavigationContainer theme={MyTheme}>
                        <Stack.Navigator>
                            <Stack.Screen name="List" component={ListScreen}
                                options={{
                                    orientation: 'all',
                                    title: 'Home',
                                    headerTitle: 'ScorePad with Rounds',
                                    header: ({ navigation }) => {
                                        return <HomeHeader navigation={navigation} />;
                                    },
                                }}
                            />
                            <Stack.Screen name="Game" component={GameScreen}
                                options={{
                                    orientation: 'all',
                                    title: "Current Game",
                                    header: ({ navigation }) => {
                                        return <GameHeader navigation={navigation} />;
                                    },
                                }}
                            />
                            <Stack.Screen name="Settings" component={SettingsScreen}
                                options={{
                                    orientation: 'all',
                                    title: "Settings",
                                    header: ({ navigation }) => {
                                        return <SettingsHeader navigation={navigation} />;
                                    },
                                }}
                            />
                            <Stack.Screen name="AppInfo" component={AppInfoScreen}
                                options={{
                                    orientation: 'all',
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
        </View>
    );
};
