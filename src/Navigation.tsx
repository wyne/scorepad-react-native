import React from 'react';

import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AppInfoHeader from '../src/components/Headers/AppInfoHeader';
import GameHeader from '../src/components/Headers/GameHeader';
import HomeHeader from '../src/components/Headers/HomeHeader';
import SettingsHeader from '../src/components/Headers/SettingsHeader';
import AppInfoScreen from '../src/screens/AppInfoScreen';
import GameScreen from '../src/screens/GameScreen';
import ListScreen from '../src/screens/ListScreen';
import OnboardingScreen from '../src/screens/OnboardingScreen';
import SettingsScreen from '../src/screens/SettingsScreen';

import EditPlayerHeader from './components/Headers/EditPlayerHeader';
import ShareHeader from './components/Headers/ShareHeader';
import EditPlayerScreen from './screens/EditPlayerScreen';
import ShareScreen from './screens/ShareScreen';

export type OnboardingScreenParamList = {
    onboarding: boolean;
};

export type RootStackParamList = {
    List: undefined;
    Game: undefined;
    Settings: {
        reason?: string;
    };
    AppInfo: undefined;
    Share: undefined;
    Onboarding: OnboardingScreenParamList;
    Tutorial: OnboardingScreenParamList;
    EditPlayer: {
        index: number | undefined;
        playerId: string | undefined;
    };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const MyTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: 'black',
    },
};

export const Navigation = () => {
    return (
        <NavigationContainer theme={MyTheme}>
            <Stack.Navigator initialRouteName='List' >
                <Stack.Screen name="List" component={ListScreen}
                    options={{
                        orientation: 'portrait',
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
                        title: 'Current Game',
                        header: ({ navigation }) => {
                            return <GameHeader navigation={navigation} />;
                        },
                    }}
                />
                <Stack.Screen name="Settings" component={SettingsScreen}
                    options={({ route }) => ({
                        orientation: 'all',
                        title: 'Settings',
                        header: ({ navigation }) => {
                            return <SettingsHeader navigation={navigation} route={route} />;
                        },
                    })}
                />
                <Stack.Screen name="Share" component={ShareScreen}
                    options={{
                        orientation: 'all',
                        title: 'Share',
                        header: ({ navigation }) => {
                            return <ShareHeader navigation={navigation} />;
                        },
                    }}
                />
                <Stack.Screen name="EditPlayer" component={EditPlayerScreen}
                    initialParams={{ index: 0, playerId: '' }}
                    options={({ route }) => ({
                        orientation: 'portrait',
                        title: 'Edit Player',
                        header: ({ navigation }) => {
                            return <EditPlayerHeader navigation={navigation} route={route} />;
                        },
                    })}
                />
                <Stack.Screen name="Onboarding" component={OnboardingScreen}
                    options={{
                        presentation: 'formSheet',
                        orientation: 'portrait',
                        title: 'Onboarding',
                        headerShown: false,
                    }}
                />
                <Stack.Screen name="AppInfo" component={AppInfoScreen}
                    options={{
                        presentation: 'modal',
                        orientation: 'portrait',
                        title: 'Info',
                        header: ({ navigation }) => {
                            return <AppInfoHeader navigation={navigation} />;
                        },
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
};
