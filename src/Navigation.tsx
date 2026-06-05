import React, { useState } from 'react';

import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';

import { useAppSelector } from '../redux/hooks';
import AppInfoButton from '../src/components/Buttons/AppInfoButton';
import GameOptionsButton from '../src/components/Buttons/GameOptionsButton';
import RoundHeaderTitle from '../src/components/Headers/RoundHeaderTitle';
import AppInfoScreen from '../src/screens/AppInfoScreen';
import DebugLogScreen from '../src/screens/DebugLogScreen';
import GameScreen from '../src/screens/GameScreen';
import ListScreen from '../src/screens/ListScreen';
import SettingsScreen from '../src/screens/SettingsScreen';

import { MenuOpenContextProvider } from './components/MenuOpenContext';
import GameSheet from './components/Sheets/GameSheet';
import { GestureInfoModalContextProvider } from './components/Sheets/GestureInfoModalContext';
import EditPlayerScreen from './screens/EditPlayerScreen';
import ShareScreen from './screens/ShareScreen';
import { useTheme } from './theme';

export type RootStackParamList = {
    List: undefined;
    Game: undefined;
    Settings: {
        source?: string;
    };
    AppInfo: undefined;
    DebugLog: undefined;
    Share: undefined;
    EditPlayer: {
        index: number | undefined;
        playerId: string | undefined;
    };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const Navigation = () => {
    const theme = useTheme();
    const isDark = theme.background === '#000000';
    const navTheme = isDark
        ? { ...DarkTheme, colors: { ...DarkTheme.colors, background: theme.background, card: theme.background } }
        : { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: theme.background, card: theme.backgroundSecondary } };

    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
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
                <GestureInfoModalContextProvider>
                    <MenuOpenContextProvider>
                        <Stack.Navigator initialRouteName='List' >
                        <Stack.Screen name="List" component={ListScreen}
                            options={{
                                orientation: 'portrait',
                                title: 'ScorePad',
                                headerTransparent: true,
                                headerBlurEffect: 'systemChromeMaterial',
                                headerShadowVisible: false,
                                headerLeft: () => <AppInfoButton />,
                            }}
                        />
                        <Stack.Screen name="Game" component={GameScreen}
                            options={{
                                orientation: 'all',
                                headerTitle: () => <RoundHeaderTitle />,
                                headerRight: () => <GameOptionsButton />,
                                headerTransparent: true,
                                headerBlurEffect: 'systemChromeMaterial',
                                headerShadowVisible: false,
                                headerBackButtonDisplayMode: 'minimal',
                            }}
                        />
                        <Stack.Screen name="Settings" component={SettingsScreen}
                            options={{
                                orientation: 'all',
                                title: 'Edit Game',
                                headerBackButtonDisplayMode: 'minimal',
                            }}
                        />
                        <Stack.Screen name="Share" component={ShareScreen}
                            options={{
                                orientation: 'all',
                                title: 'Share',
                            }}
                        />
                        <Stack.Screen name="EditPlayer" component={EditPlayerScreen}
                            initialParams={{ index: 0, playerId: '' }}
                            options={{
                                orientation: 'portrait',
                                title: 'Edit Player',
                            }}
                        />
                        <Stack.Screen name="AppInfo" component={AppInfoScreen}
                            options={{
                                presentation: 'modal',
                                orientation: 'portrait',
                                title: 'Settings',
                            }}
                        />
                        <Stack.Screen name="DebugLog" component={DebugLogScreen}
                            options={{
                                presentation: 'modal',
                                orientation: 'portrait',
                                title: 'Debug Log',
                            }}
                        />
                        </Stack.Navigator>
                    </MenuOpenContextProvider>
                </GestureInfoModalContextProvider>
                {!fullscreen && currentRoute === 'Game' && <GameSheet />}
            </NavigationContainer>
        </View>
    );
};
