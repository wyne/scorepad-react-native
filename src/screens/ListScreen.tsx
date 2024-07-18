import React, { memo, useEffect } from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Application from 'expo-application';
import { BlurView } from 'expo-blur';
import * as Crypto from 'expo-crypto';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, LinearTransition } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SemVer, parse } from 'semver';

import { selectGameIds } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { increaseAppOpens, setInstallId, setOnboardedVersion } from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';
import GameListItem from '../components/GameListItem';
import { getPendingOnboardingSemVer } from '../components/Onboarding/Onboarding';
import logger from '../Logger';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ListScreen: React.FunctionComponent<Props> = ({ navigation }) => {
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

    useEffect(() => {
        logger.info(`Onboarded: ${onboarded}`);

        if (installId === undefined) {
            console.log('no install id');
            const installId = Crypto.randomUUID();
            dispatch(setInstallId(installId));
        }

        logEvent('game_list', {
            onboarded: onboarded,
            gameCount: gameIds.length,
            appOpens: appOpens,
            appVersion: appVersion.version,
            devMenuEnabled: devMenuEnabled,
            onboardedVersion: onboardedSemVer?.version,
            pendingOnboardingVersion: pendingOnboardingVer,
            installId: installId,
        });

        logger.info('App Opens: ', appOpens);
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
        <SafeAreaView edges={['bottom', 'left', 'right']} style={{ backgroundColor: 'white', flex: 1 }}>
            <Animated.FlatList
                ListFooterComponent={<View style={{ paddingBottom: 25 }}></View>}
                itemLayoutAnimation={LinearTransition.easing(Easing.ease)}
                ListEmptyComponent={
                    <>
                        <Text style={{ textAlign: 'center', padding: 30, paddingBottom: 10, fontSize: 16, fontWeight: 'bold' }}>No Games</Text>
                        <Text style={{ textAlign: 'center', padding: 10 }}>Tap the + button above to create a new game.</Text>
                    </>
                }
                style={styles.list}
                data={gameIds}
                renderItem={({ item, index }) =>
                    <GameListItem navigation={navigation} gameId={item} index={index} />
                }
                keyExtractor={item => item}
            >
            </Animated.FlatList>
            <BlurView intensity={20} style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
                justifyContent: 'flex-start', alignItems: 'center',
                borderTopWidth: 1, borderColor: '#ccc',
                display: gameIds.length > 0 ? undefined : 'none',
            }}>
                <Text style={{ paddingTop: 10, color: '#555', fontSize: 12 }}>Long press for more options.</Text>
            </BlurView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    list: {
        backgroundColor: 'white',
    },
    gameSubtitle: {
        color: '#999',
    },
    newGame: {
        margin: 20,
        width: 200,
        alignSelf: 'center',
    }
});

export default memo(ListScreen);
