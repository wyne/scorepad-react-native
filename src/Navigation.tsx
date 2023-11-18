import React from 'react';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Application from 'expo-application';

import ListScreen from "../src/screens/ListScreen";
import GameScreen from "../src/screens/GameScreen";
import SettingsScreen from "../src/screens/SettingsScreen";
import AppInfoScreen from "../src/screens/AppInfoScreen";
import OnboardingScreen from '../src/screens/OnboardingScreen';
import ShareScreen from './screens/ShareScreen';
import HomeHeader from '../src/components/Headers/HomeHeader';
import GameHeader from '../src/components/Headers/GameHeader';
import SettingsHeader from '../src/components/Headers/SettingsHeader';
import AppInfoHeader from '../src/components/Headers/AppInfoHeader';
import { useAppSelector } from '../redux/hooks';
import { SemVer, parse } from 'semver';
import ShareHeader from './components/Headers/ShareHeader';

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
    const onboardedStr = useAppSelector(state => state.settings.onboarded);
    const onboardedSemVer = parse(onboardedStr);
    const appVersion = new SemVer(Application.nativeApplicationVersion || '0.0.0');

    console.log(`App Version: ${appVersion}`);
    console.log(`Onboarded Version: ${onboardedSemVer}`);

    let onboarded = true;

    if (onboardedSemVer == null || onboardedSemVer?.compare(new SemVer('2.2.2')) == -1) {
        onboarded = false;
    }

    return (
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
                <Stack.Screen name="AppInfo" component={AppInfoScreen}
                    options={{
                        orientation: 'portrait',
                        title: "Info",
                        header: ({ navigation }) => {
                            return <AppInfoHeader navigation={navigation} />;
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
                    options={({ route }) => ({
                        orientation: 'all',
                        title: "Settings",
                        header: ({ navigation }) => {
                            return <SettingsHeader navigation={navigation} route={route} />;
                        },
                    })}
                />
                <Stack.Screen name="Share" component={ShareScreen}
                    options={{
                        orientation: 'all',
                        title: "Share",
                        header: ({ navigation }) => {
                            return <ShareHeader navigation={navigation} />;
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
    );
};
