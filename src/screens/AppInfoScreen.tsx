import React, { useEffect, useRef } from 'react';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/routers';
import * as Application from 'expo-application';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { exportBackup, importBackup } from '../../redux/backup';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { markFeatureNotificationSeen, resetOnboarding, resetSeenFeatureNotifications, setKeepScreenAwake, toggleShowPlayerIndex, toggleShowPointParticles } from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';
import RotatingIcon from '../components/AppInfo/RotatingIcon';
import { FEATURE_KEEP_SCREEN_AWAKE } from '../constants';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const Section = ({ children, title }: { children: React.ReactNode, title: string; }) => (
    <>
        <Text style={styles.sectionHeader}>{title}</Text>
        <View style={styles.section}>
            {children}
        </View>
    </>
);
const SectionItem = ({ children }: { children: React.ReactNode; }) => (
    <View style={styles.sectionItem}>
        {children}
    </View>
);
const SectionItemText = ({ text }: { text: string; }) => (
    <Text style={styles.sectionItemText}>{text}</Text>
);
const SectionSeparator = () => (
    <View style={{ height: 1, backgroundColor: '#EFEFF4' }} />
);
const DisclosureRow = ({ label, onPress }: { label: string; onPress: () => void; }) => (
    <TouchableOpacity style={styles.disclosureRow} onPress={onPress}>
        <Text style={styles.disclosureLabel}>{label}</Text>
        <Text style={styles.disclosureArrow}>›</Text>
    </TouchableOpacity>
);

const AppInfoScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const buildNumber = Application.nativeBuildVersion;
    const appVersion = Application.nativeApplicationVersion;

    const showPointParticles = useAppSelector(state => state.settings.showPointParticles);
    const showPlayerIndex = useAppSelector(state => state.settings.showPlayerIndex);
    const devMenuEnabled = useAppSelector(state => state.settings.devMenuEnabled);
    const installId = useAppSelector(state => state.settings.installId);
    const seenFeatureNotifications = useAppSelector(state => state.settings.seenFeatureNotifications);
    const keepScreenAwake = useAppSelector(state => state.settings.keepScreenAwake);

    const dispatch = useAppDispatch();

    const isUnseen = !seenFeatureNotifications.includes(FEATURE_KEEP_SCREEN_AWAKE);
    const featureNotificationsResetRef = useRef(false);

    useEffect(() => {
        return () => {
            if (featureNotificationsResetRef.current) return;
            dispatch(markFeatureNotificationSeen(FEATURE_KEEP_SCREEN_AWAKE));
        };
    }, [dispatch]);

    const toggleParticleSwitch = () => {
        dispatch(toggleShowPointParticles());
        logEvent('toggle_feature', {
            feature: 'point_particles',
            value: !showPointParticles,
            installId
        });
    };
    const togglePlayerIndexSwitch = () => {
        dispatch(toggleShowPlayerIndex());
        logEvent('toggle_feature', {
            feature: 'player_index',
            value: !showPlayerIndex,
            installId
        });
    };
    const toggleKeepAwake = () => {
        const newValue = !keepScreenAwake;
        if (newValue) {
            Alert.alert(
                'Keep Screen Awake',
                'Your screen will not auto-lock while Keep Screen Awake is enabled. This could be a security risk if you leave your device unattended.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'OK', style: 'default', onPress: () => {
                            dispatch(setKeepScreenAwake(true));
                            logEvent('toggle_feature', {
                                feature: 'keep_screen_awake',
                                value: true,
                                installId
                            });
                        }
                    },
                ]
            );
        } else {
            dispatch(setKeepScreenAwake(false));
            logEvent('toggle_feature', {
                feature: 'keep_screen_awake',
                value: false,
                installId
            });
        }
    };
    const handleRestore = () => {
        Alert.alert(
            'Restore from Backup',
            'This will replace all current games, players, and scores with the data from the backup. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Restore', style: 'destructive', onPress: importBackup },
            ]
        );
    };

    const handleExport = async () => {
        await exportBackup();
    };

    const alertWithVersion = async () => {
        Alert.alert('ScorePad with Rounds\n' +
            `v${appVersion} (${buildNumber})\n` +
            `${Platform.OS} ${Platform.Version}\n` +
            (process.env.EXPO_PUBLIC_FIREBASE_ANALYTICS)
        );
        await logEvent('view_version');
    };

    return (
        <ScrollView style={{ backgroundColor: '#F2F2F7', flex: 1 }} contentContainerStyle={{ paddingBottom: 50 }}>
            <View style={[styles.iconWrapper, { alignItems: 'center' }]}>
                <RotatingIcon />
                <Text style={{ color: '#999' }} onPress={alertWithVersion}>
                    ScorePad with Rounds v{appVersion}
                </Text>
                <Text style={{ color: '#999', paddingVertical: 5 }}>
                    by Justin Wyne
                </Text>
            </View>

            <Section title="Features">
                <SectionItem>
                    <SectionItemText text="Particle Effect (tap-only)" />
                    <Switch onValueChange={toggleParticleSwitch} value={showPointParticles} ios_backgroundColor="#E5E5EA" />
                </SectionItem>
                <SectionSeparator />
                <SectionItem>
                    <View style={styles.labelRow}>
                        <SectionItemText text="Player Numbers" />
                        <View style={styles.betaPill}>
                            <Text style={styles.betaPillText}>Beta</Text>
                        </View>
                    </View>
                    <Switch onValueChange={togglePlayerIndexSwitch} value={showPlayerIndex} ios_backgroundColor="#E5E5EA" />
                </SectionItem>
                <SectionSeparator />
                <SectionItem>
                    <View style={styles.labelRow}>
                        {isUnseen && <View style={styles.featureDot} />}
                        <SectionItemText text="Keep Screen Awake" />
                        <View style={styles.betaPill}>
                            <Text style={styles.betaPillText}>Beta</Text>
                        </View>
                    </View>
                    <Switch onValueChange={toggleKeepAwake} value={keepScreenAwake} ios_backgroundColor="#E5E5EA" />
                </SectionItem>
            </Section>

            {devMenuEnabled && (
                <Section title="Developer">
                    <DisclosureRow label="Reset Feature Notifications" onPress={() => {
                        Alert.alert(
                            'Reset Feature Notifications',
                            'This will clear all seen feature notifications, causing orange dots to reappear.',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Reset', style: 'destructive', onPress: () => {
                                        featureNotificationsResetRef.current = true;
                                        dispatch(resetSeenFeatureNotifications());
                                        setTimeout(() => navigation.goBack(), 0);
                                    }
                                },
                            ]
                        );
                    }} />
                    <SectionSeparator />
                    <DisclosureRow label="Reset Onboarding" onPress={() => {
                        Alert.alert(
                            'Reset Onboarding',
                            'Your onboarding progress will be reset. Return to the home screen to trigger the onboarding flow.',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Reset', style: 'destructive', onPress: () => {
                                        dispatch(resetOnboarding());
                                        navigation.goBack();
                                    }
                                },
                            ]
                        );
                    }} />
                </Section>
            )}

            <Section title="Backup">
                <DisclosureRow label="Export Backup" onPress={handleExport} />
                <SectionSeparator />
                <DisclosureRow label="Restore from Backup" onPress={handleRestore} />
            </Section>

            <Section title="Help">
                <DisclosureRow label="View Tutorial" onPress={() => {
                    navigation.navigate('Onboarding', { onboarding: false });
                }} />
            </Section>

            <Section title="Contact">
                <SectionItem>
                    <SectionItemText text="For questions and feedback, please visit the website or use the email address below." />
                </SectionItem>
                <SectionSeparator />
                <DisclosureRow label="scorepad@justinwyne.com" onPress={() => {
                    Linking.openURL('mailto:scorepad@justinwyne.com');
                }} />
                <SectionSeparator />
                <DisclosureRow label="www.scorepadapp.com" onPress={() => {
                    Linking.openURL('https://www.scorepadapp.com');
                }} />
            </Section>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    iconWrapper: {
        flex: 1,
        margin: 10,
        alignContent: 'center',
        justifyContent: 'center',
    },
    sectionHeader: {
        fontSize: 12,
        marginTop: 20,
        padding: 5,
        paddingHorizontal: 40,
        color: '#93939A',
        textTransform: 'uppercase',
    },
    section: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        marginHorizontal: 20,
        borderRadius: 10,
    },
    sectionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 5,
    },
    sectionItemText: {
        fontSize: 16,
        paddingVertical: 5,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    betaPill: {
        backgroundColor: '#E5E5EA',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 6,
    },
    betaPillText: {
        fontSize: 11,
        color: '#666',
    },
    featureDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF9500',
        marginRight: 8,
    },
    disclosureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    disclosureLabel: {
        fontSize: 16,
    },
    disclosureArrow: {
        fontSize: 20,
        color: '#C8C8CC',
    },
    text: {
        fontSize: 16,
        paddingVertical: 20,
    },
});

export default AppInfoScreen;
