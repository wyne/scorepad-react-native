import React, { memo, useEffect } from 'react';

import { useHeaderHeight } from '@react-navigation/elements';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Application from 'expo-application';
import * as Crypto from 'expo-crypto';
import { StyleSheet, Text } from 'react-native';
import Animated, { Easing, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SemVer, parse } from 'semver';

import { selectGameIds } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { increaseAppOpens, setInstallId, setOnboardedVersion, setRollingGameCounter } from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';
import FloatingActionButton from '../components/FloatingActionButton';
import GameListItem from '../components/GameListItem';
import { getPendingOnboardingSemVer } from '../components/Onboarding/Onboarding';
import logger from '../Logger';
import { useTheme } from '../theme';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ListScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const theme = useTheme();
    const appOpens = useAppSelector(state => state.settings.appOpens);
    const devMenuEnabled = useAppSelector(state => state.settings.devMenuEnabled);
    const installId = useAppSelector(state => state.settings.installId);
    const gameIds = useAppSelector(state => selectGameIds(state));
    const dispatch = useAppDispatch();

    const onboardedStr = useAppSelector(state => state.settings.onboarded);
    const onboardedSemVer = parse(onboardedStr);
    const appVersion = new SemVer(Application.nativeApplicationVersion || '0.0.0');
    const pendingOnboardingVer = getPendingOnboardingSemVer(onboardedSemVer);
    const onboarded = pendingOnboardingVer === undefined;
    const rollingGameCounter = useAppSelector(state => state.settings.rollingGameCounter);
    const headerHeight = useHeaderHeight();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (installId === undefined) {
            const installId = Crypto.randomUUID();
            dispatch(setInstallId(installId));
        }

        // Update rollingGameCounter if it is undefined or less than the current gameIds length
        if (rollingGameCounter === undefined || rollingGameCounter < gameIds.length) {
            setRollingGameCounter(gameIds.length);
        }

        logEvent('game_list', {
            onboarded,
            gameCount: gameIds.length,
            appOpens,
            appVersion: appVersion.version,
            devMenuEnabled,
            onboardedVersion: onboardedSemVer?.version,
            pendingOnboardingVersion: pendingOnboardingVer,
            installId,
            rollingGameCounter,
        });

        dispatch(increaseAppOpens());
    }, []);

    useEffect(() => {
        if (!onboarded) {
            logger.info('Show onboarding!');
            navigation.navigate('Onboarding', { onboarding: true, version: onboardedSemVer });
            dispatch(setOnboardedVersion());
        }
    }, [onboarded, dispatch, navigation]);

    return (
        <SafeAreaView edges={['left', 'right']} style={{ backgroundColor: theme.backgroundSecondary, flex: 1 }} testID="home-screen">
            <Animated.FlatList
                alwaysBounceVertical
                contentContainerStyle={{ flexGrow: 1, paddingTop: headerHeight, paddingBottom: insets.bottom + 70 }}
                contentInsetAdjustmentBehavior="never"
                scrollIndicatorInsets={{ top: headerHeight, bottom: insets.bottom + 70 }}
                itemLayoutAnimation={LinearTransition.easing(Easing.ease)}
                ListEmptyComponent={
                    <>
                        <Text style={{ textAlign: 'center', padding: 30, paddingBottom: 10, fontSize: 16, fontWeight: 'bold', color: theme.text }}>No Games</Text>
                        <Text style={{ textAlign: 'center', padding: 10, color: theme.textSecondary }}>Tap the + button to create a new game.</Text>
                    </>
                }
                style={[styles.list, { backgroundColor: theme.backgroundSecondary }]}
                data={gameIds}
                renderItem={({ item, index }) =>
                    <GameListItem navigation={navigation} gameId={item as string} index={index} />
                }
                keyExtractor={item => item as string}
            >
            </Animated.FlatList>
            <FloatingActionButton navigation={navigation} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    list: {
    },
});

export default memo(ListScreen);
