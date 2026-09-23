import React, { useRef, useState } from 'react';

import { DarkTheme, DefaultTheme, NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Platform, View } from 'react-native';

import { useAppSelector } from '../redux/hooks';
import { logScreenView } from '../src/Analytics';
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
import { useRoundPickerInBottomStrip, useVerticalBarLayout } from './hooks/useExpandedGameLayout';
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

/**
 * Header options for a header with no background. With vertical bars (iPhone
 * Duo), the native header background starts below a strip at the top of the
 * screen and stops short of the vertical bar, so it reads as a box. Without
 * it, the buttons sit in the vertical bar and anything left in the header
 * (the round picker's glass pill) floats over the content.
 */
const bareHeaderOptions: NativeStackNavigationOptions = {
    headerTransparent: true,
    headerBlurEffect: 'none',
    headerStyle: { backgroundColor: 'transparent' },
    headerShadowVisible: false,
};

/**
 * Header options for a header with nothing left in it: its buttons are in the
 * vertical bar and its title, if any, is in the content. It collapses to a
 * transparent strip, and the content can fill the screen to the top edge.
 */
const collapsedHeaderOptions: NativeStackNavigationOptions = {
    ...bareHeaderOptions,
    title: '',
    headerTitle: undefined,
};

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
    // On the iPhone Duo's inner display the round picker sits beside the game
    // sheet instead of in the header, and the header collapses (see GameSheet).
    const roundPickerInHeader = !useRoundPickerInBottomStrip();
    // With vertical bars (iPhone Duo), headers drop their background (see
    // bareHeaderOptions). iOS also scrolls the list's header title away with
    // the content, so that title moves into the list (see ListScreen) and the
    // list's header collapses.
    const verticalBars = useVerticalBarLayout();
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
            void logScreenView(routeName);
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
                                // iOS uses native items set by the screen (see useAppSettingsHeaderItems).
                                headerLeft: isIOS ? undefined : () => <AppSettingsButton />,
                                ...(verticalBars ? collapsedHeaderOptions : undefined),
                            }}
                        />
                        <Stack.Screen name="Game" component={GameScreen}
                            options={{
                                orientation: 'all',
                                title: '',
                                headerTitle: roundPickerInHeader ? () => <RoundHeaderTitle /> : undefined,
                                // iOS uses native items set by the screen (see useGameOptionsHeaderItems).
                                headerRight: isIOS ? undefined : () => <GameOptionsButton />,
                                headerTransparent: true,
                                headerBlurEffect: 'systemChromeMaterial',
                                headerShadowVisible: false,
                                headerBackButtonDisplayMode: 'minimal',
                                headerTitleAlign: 'center',
                                ...(verticalBars ? bareHeaderOptions : undefined),
                                ...(roundPickerInHeader ? undefined : collapsedHeaderOptions),
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
