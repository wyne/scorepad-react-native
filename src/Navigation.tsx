import React, { useState } from 'react';

import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackHeaderProps, NativeStackOptionsArgs } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { SemVer } from 'semver';

import { useAppSelector } from '../redux/hooks';
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
import GameSheet from './components/Sheets/GameSheet';
import EditPlayerScreen from './screens/EditPlayerScreen';
import ShareScreen from './screens/ShareScreen';
import { useTheme } from './theme';

export type OnboardingScreenParamList = {
    onboarding: boolean;
    version: SemVer;
};

export type RootStackParamList = {
    List: undefined;
    Game: undefined;
    Settings: {
        source?: string;
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

export const Navigation = () => {
    const theme = useTheme();
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const isDark = theme.background === '#000000';
    const navTheme = isDark
        ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: theme.background, card: theme.background } }
        : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.background, card: theme.backgroundSecondary } };

    const [currentRoute, setCurrentRoute] = useState('List');

    return (
        <View style={{ flex: 1 }}>
            <NavigationContainer
                theme={navTheme}
                onStateChange={(state) => {
                    const route = state?.routes[state.index ?? 0];
                    if (route) {
                        setCurrentRoute(route.name);
                    }
                }}
            >
                <Stack.Navigator initialRouteName='List' >
                    <Stack.Screen name="List" component={ListScreen}
                        options={{
                            orientation: 'portrait',
                            title: 'Home',
                            headerTitle: 'ScorePad with Rounds',
                            header: ({ navigation }: NativeStackHeaderProps) => {
                                return <HomeHeader navigation={navigation} />;
                            },
                        }}
                    />
                    <Stack.Screen name="Game" component={GameScreen}
                        options={{
                            orientation: 'all',
                            title: 'Current Game',
                            header: ({ navigation }: NativeStackHeaderProps) => {
                                return <GameHeader navigation={navigation} />;
                            },
                        }}
                    />
                    <Stack.Screen name="Settings" component={SettingsScreen}
                        options={({ route }: NativeStackOptionsArgs<RootStackParamList, 'Settings'>) => ({
                            orientation: 'all',
                            title: 'Settings',
                            header: ({ navigation }: NativeStackHeaderProps) => {
                                return <SettingsHeader navigation={navigation} route={route} />;
                            },
                        })}
                    />
                    <Stack.Screen name="Share" component={ShareScreen}
                        options={{
                            orientation: 'all',
                            title: 'Share',
                            header: ({ navigation }: NativeStackHeaderProps) => {
                                return <ShareHeader navigation={navigation} />;
                            },
                        }}
                    />
                    <Stack.Screen name="EditPlayer" component={EditPlayerScreen}
                        initialParams={{ index: 0, playerId: '' }}
                        options={({ route }: NativeStackOptionsArgs<RootStackParamList, 'EditPlayer'>) => ({
                            orientation: 'portrait',
                            title: 'Edit Player',
                            header: ({ navigation }: NativeStackHeaderProps) => {
                                return <EditPlayerHeader navigation={navigation} route={route} />;
                            },
                        })}
                    />
                    <Stack.Screen name="Onboarding" component={OnboardingScreen}
                        options={{
                            presentation: 'modal',
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
                            header: ({ navigation }: NativeStackHeaderProps) => {
                                return <AppInfoHeader navigation={navigation} />;
                            },
                        }}
                    />
                </Stack.Navigator>
                {!fullscreen && currentRoute === 'Game' && <GameSheet />}
            </NavigationContainer>
        </View>
    );
};
