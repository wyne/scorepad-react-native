import React, { useRef, useState } from 'react';

import { getAnalytics, logScreenView } from '@react-native-firebase/analytics';
import { DarkTheme, DefaultTheme, NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
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
import { useAnalyticsUserProperties } from './hooks/useAnalyticsUserProperties';
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
    useAnalyticsUserProperties();
    const navigationRef = useNavigationContainerRef<RootStackParamList>();
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
    const [showGameSheetForActiveRoute, setShowGameSheetForActiveRoute] = useState(false);

    // Track the last logged route so we emit one screen_view per actual navigation,
    // not on every navigation state change.
    const loggedRouteNameRef = useRef<string | undefined>(undefined);

    const handleActiveRouteChange = () => {
        const routeName = navigationRef.getCurrentRoute()?.name;
        setShowGameSheetForActiveRoute(routeName === 'Game');

        // Manual screen tracking: automatic native reporting only sees the
        // react-native-screens wrapper class (RNSScreen) with no name, so we log the
        // React Navigation route name instead. Automatic reporting is disabled in
        // firebase.json. Fire-and-forget — never block navigation on analytics.
        if (routeName && routeName !== loggedRouteNameRef.current) {
            loggedRouteNameRef.current = routeName;
            logScreenView(getAnalytics(), { screen_name: routeName, screen_class: routeName });
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <NavigationContainer
                ref={navigationRef}
                theme={navTheme}
                onReady={handleActiveRouteChange}
                onStateChange={handleActiveRouteChange}
            >
                <GestureInfoSheetContextProvider>
                    <MenuOpenContextProvider>
                        <Stack.Navigator initialRouteName='List' >
                        <Stack.Screen name="List" component={ListScreen}
                            options={{
                                freezeOnBlur: true,
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
                            listeners={{
                                focus: () => setShowGameSheetForActiveRoute(true),
                                transitionStart: (event) => {
                                    if (event.data.closing) {
                                        setShowGameSheetForActiveRoute(false);
                                    }
                                },
                                blur: () => setShowGameSheetForActiveRoute(false),
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
                {!fullscreen && showGameSheetForActiveRoute && <GameSheet />}
            </NavigationContainer>
        </View>
    );
};
