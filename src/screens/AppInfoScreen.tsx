import React, { useEffect, useLayoutEffect, useRef } from 'react';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/routers';
import * as Application from 'expo-application';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { exportBackup, importBackup } from '../../redux/backup';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { markFeatureNotificationSeen, resetOnboarding, resetSeenFeatureNotifications, setColorScheme, setKeepScreenAwake, toggleShowPlayerIndex, toggleShowPointParticles } from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';
import RotatingIcon from '../components/AppInfo/RotatingIcon';
import HeaderButton from '../components/Buttons/HeaderButton';
import { FEATURE_KEEP_SCREEN_AWAKE } from '../constants';
import { useTheme } from '../theme';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const AppInfoScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const theme = useTheme();

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <HeaderButton accessibilityLabel='Done'
                    onPress={() => { navigation.goBack(); }}>
                    <Text style={{ color: theme.tint, fontSize: 20 }} allowFontScaling={false}>Done</Text>
                </HeaderButton>
            ),
        });
    }, [navigation, theme.tint]);
    const Section = ({ children, title }: { children: React.ReactNode, title: string; }) => (
        <>
            <Text style={[styles.sectionHeader, { color: theme.textTertiary }]}>{title}</Text>
            <View style={[styles.section, { backgroundColor: theme.backgroundSecondary }]}>
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
        <Text style={[styles.sectionItemText, { color: theme.text }]}>{text}</Text>
    );
    const SectionSeparator = () => (
        <View style={{ height: 1, backgroundColor: theme.separator }} />
    );
    const DisclosureRow = ({ label, onPress }: { label: string; onPress: () => void; }) => (
        <TouchableOpacity style={styles.disclosureRow} onPress={onPress}>
            <Text style={[styles.disclosureLabel, { color: theme.text }]}>{label}</Text>
            <Text style={[styles.disclosureArrow, { color: theme.separator }]}>›</Text>
        </TouchableOpacity>
    );
    const buildNumber = Application.nativeBuildVersion;
    const appVersion = Application.nativeApplicationVersion;

    const showPointParticles = useAppSelector(state => state.settings.showPointParticles);
    const showPlayerIndex = useAppSelector(state => state.settings.showPlayerIndex);
    const devMenuEnabled = useAppSelector(state => state.settings.devMenuEnabled);
    const installId = useAppSelector(state => state.settings.installId);
    const seenFeatureNotifications = useAppSelector(state => state.settings.seenFeatureNotifications);
    const keepScreenAwake = useAppSelector(state => state.settings.keepScreenAwake);
    const colorScheme = useAppSelector(state => state.settings.colorScheme ?? 'system');

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
        <ScrollView style={{ backgroundColor: theme.background, flex: 1 }} contentContainerStyle={{ paddingBottom: 50 }}>
            <View style={[styles.iconWrapper, { alignItems: 'center' }]}>
                <RotatingIcon />
                <Text style={{ color: theme.textTertiary }} onPress={alertWithVersion}>
                    ScorePad with Rounds v{appVersion}
                </Text>
                <Text style={{ color: theme.textTertiary, paddingVertical: 5 }}>
                    by Justin Wyne
                </Text>
            </View>

            <Section title="Features">
                <SectionItem>
                    <SectionItemText text="Particle Effect (tap-only)" />
                    <Switch onValueChange={toggleParticleSwitch} value={showPointParticles} ios_backgroundColor={theme.separator} />
                </SectionItem>
                <SectionSeparator />
                <SectionItem>
                    <View style={styles.labelRow}>
                        <SectionItemText text="Player Numbers" />
                        <View style={[styles.betaPill, { backgroundColor: theme.separator }]}>
                            <Text style={[styles.betaPillText, { color: theme.text }]}>Beta</Text>
                        </View>
                    </View>
                    <Switch onValueChange={togglePlayerIndexSwitch} value={showPlayerIndex} ios_backgroundColor={theme.separator} />
                </SectionItem>
                <SectionSeparator />
                <SectionItem>
                    <View style={styles.labelRow}>
                        {isUnseen && <View style={[styles.featureDot, { backgroundColor: theme.warning }]} />}
                        <SectionItemText text="Keep Screen Awake" />
                            <View style={[styles.betaPill, { backgroundColor: theme.separator }]}>
                            <Text style={[styles.betaPillText, { color: theme.text }]}>Beta</Text>
                        </View>
                    </View>
                    <Switch onValueChange={toggleKeepAwake} value={keepScreenAwake} ios_backgroundColor={theme.separator} />
                </SectionItem>
            </Section>

            <Section title="Appearance">
                {(['system', 'light', 'dark'] as const).map((option, i, arr) => (
                    <React.Fragment key={option}>
                        <TouchableOpacity
                            style={[styles.disclosureRow]}
                            onPress={() => dispatch(setColorScheme(option))}
                        >
                            <Text style={[styles.disclosureLabel, { color: theme.text }]}>
                                {option.charAt(0).toUpperCase() + option.slice(1)}
                            </Text>
                            {colorScheme === option && (
                                <Text style={{ color: theme.tint, fontSize: 18 }}>✓</Text>
                            )}
                        </TouchableOpacity>
                        {i < arr.length - 1 && <SectionSeparator />}
                    </React.Fragment>
                ))}
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
        textTransform: 'uppercase',
    },
    section: {
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
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 6,
    },
    betaPillText: {
        fontSize: 11,
    },
    featureDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
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
    },
    text: {
        fontSize: 16,
        paddingVertical: 20,
    },
});

export default AppInfoScreen;
