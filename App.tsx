import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ListScreen from "./src/screens/ListScreen";
import GameScreen from "./src/screens/GameScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import AppInfoScreen from "./src/screens/AppInfoScreen";
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeHeader from './src/components/Headers/HomeHeader';
import GameHeader from './src/components/Headers/GameHeader';
import SettingsHeader from './src/components/Headers/SettingsHeader';
import AppInfoHeader from './src/components/Headers/AppInfoHeader';

export type RootStackParamList = {
    List: undefined;
    Game: undefined;
    Settings: undefined;
    AppInfo: undefined;
    Onboarding: OnboardingScreenParamList;
    Tutorial: OnboardingScreenParamList;
};

export type OnboardingScreenParamList = {
    onboarding: boolean;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const MyTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: 'black',
    },
};

export default function App() {
    // TODO: Make this a real check
    const onboarded = false;

    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <StatusBar />
                <NavigationContainer theme={MyTheme}>
                    <Stack.Navigator>
                        {!onboarded &&
                            <Stack.Screen name="Onboarding" component={OnboardingScreen}
                                initialParams={{ onboarding: true }}
                                options={{
                                    orientation: 'portrait',
                                    title: "Onboarding",
                                    headerShown: false,
                                }}
                            />
                        }
                        <Stack.Screen name="AppInfo" component={AppInfoScreen}
                            options={{
                                orientation: 'all',
                                title: "Info",
                                header: ({ navigation }) => {
                                    return <AppInfoHeader navigation={navigation} />;
                                },
                            }}
                        />
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
                        <Stack.Screen name="Tutorial" component={OnboardingScreen}
                            initialParams={{ onboarding: false }}
                            options={{
                                orientation: 'portrait',
                                title: "Tutorial",
                            }}
                        />
                    </Stack.Navigator>
                </NavigationContainer>
            </PersistGate>
        </Provider>
    );
}
