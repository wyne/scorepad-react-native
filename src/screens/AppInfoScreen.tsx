import React from 'react';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/routers';
import * as Application from 'expo-application';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from 'react-native-elements';

import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { toggleShowPlayerIndex, toggleShowPointParticles } from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';
import RotatingIcon from '../components/AppInfo/RotatingIcon';

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
    <Text style={styles.sectionItemText}>{text} </Text>
);
const SectionSeparator = () => (
    <View style={{ height: 1, backgroundColor: '#EFEFF4' }} />
);

const AppInfoScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const buildNumber = Application.nativeBuildVersion;
    const appVersion = Application.nativeApplicationVersion;

    const showPointParticles = useAppSelector(state => state.settings.showPointParticles);
    const showPlayerIndex = useAppSelector(state => state.settings.showPlayerIndex);
    const devMenuEnabled = useAppSelector(state => state.settings.devMenuEnabled);
    const installId = useAppSelector(state => state.settings.installId);

    const dispatch = useAppDispatch();
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

    const alertWithVersion = async () => {
        Alert.alert('ScorePad with Rounds\n' +
            `v${appVersion} (${buildNumber})\n` +
            `${Platform.OS} ${Platform.Version}\n` +
            (process.env.EXPO_PUBLIC_FIREBASE_ANALYTICS)
        );
        await logEvent('view_version');
    };

    return (
        <ScrollView style={{ backgroundColor: '#F2F2F7', flex: 1 }}>
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
                    <Switch onValueChange={toggleParticleSwitch} value={showPointParticles} />
                </SectionItem>
                <SectionItem>
                    <SectionItemText text="Player Numbers (Beta*)" />
                    <Switch onValueChange={togglePlayerIndexSwitch} value={showPlayerIndex} />
                </SectionItem>
                <SectionItem>
                    <SectionItemText text="*Beta features may change or be removed without warning." />
                </SectionItem>
                {devMenuEnabled && (
                    <>
                    </>
                )}
            </Section>

            <Section title="Help">
                <SectionItem>
                    <SectionItemText text="Instructions" />
                    <Button title="View Tutorial" type="clear" onPress={() => {
                        navigation.navigate('Onboarding', { onboarding: false });
                    }} />
                </SectionItem>
            </Section>

            <Section title="Contact">
                <SectionItem>
                    <SectionItemText text="For questions and feedback, please visit the website below." />
                </SectionItem>
                <SectionSeparator />
                <SectionItem>
                    <Button title="www.scorepadapp.com" type="clear" onPress={() => {
                        Linking.openURL('https://www.scorepadapp.com');
                    }} />
                </SectionItem>
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
    text: {
        fontSize: 16,
        paddingVertical: 20,
    },
});

export default AppInfoScreen;
