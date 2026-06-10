import React, { useState } from 'react';

import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, View } from 'react-native';

import { useAppSelector } from '../redux/hooks';
import AppSettingsButton from '../src/components/Buttons/AppSettingsButton';
import GameOptionsButton from '../src/components/Buttons/GameOptionsButton';
import RoundHeaderTitle from '../src/components/Headers/RoundHeaderTitle';
import AppSettingsScreen from '../src/screens/AppSettingsScreen';
import DebugLogScreen from '../src/screens/DebugLogScreen';
import EditGameScreen from '../src/screens/EditGameScreen';
import GameScreen from '../src/screens/GameScreen';
import ListScreen from '../src/screens/ListScreen';

import { MenuOpenContextProvider } from './components/MenuOpenContext';
import GameSheet from './components/Sheets/GameSheet';
import { GestureInfoSheetContextProvider } from './components/Sheets/GestureInfoSheetContext';
import EditPlayerScreen from './screens/EditPlayerScreen';
import ShareScreen from './screens/ShareScreen';
import { useTheme } from './theme';

export type RootStackParamList = {
    List: undefined;
    Game: undefined;
    EditGame: {
        source?: string;
    };
    AppSettings: undefined;
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
    const isAndroid = Platform.OS === 'android';
    const isIOS = Platform.OS === 'ios';
    const listHeaderStyle = isAndroid
        ? { backgroundColor: theme.backgroundSecondary }
        : undefined;
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
                <GestureInfoSheetContextProvider>
                    <MenuOpenContextProvider>
                        <Stack.Navigator initialRouteName='List' >
                        <Stack.Screen name="List" component={ListScreen}
                            options={{
                                orientation: 'portrait',
                                title: 'ScorePad',
                                headerTransparent: isIOS,
                                headerBlurEffect: isIOS ? 'systemChromeMaterial' : undefined,
                                headerShadowVisible: isAndroid,
                                headerStyle: listHeaderStyle,
                                headerLeft: () => <AppSettingsButton />,
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
                        <Stack.Screen name="EditGame" component={EditGameScreen}
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
                        <Stack.Screen name="AppSettings" component={AppSettingsScreen}
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
                </GestureInfoSheetContextProvider>
                {!fullscreen && currentRoute === 'Game' && <GameSheet />}
            </NavigationContainer>
        </View>
    );
};
