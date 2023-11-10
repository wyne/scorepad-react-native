import React from 'react';
import { Text, View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Platform, Switch } from 'react-native';
import * as Application from 'expo-application';
import analytics from '@react-native-firebase/analytics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/routers';

import RotatingIcon from '../components/AppInfo/RotatingIcon';
import { Button } from 'react-native-elements';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { toggleshowPointParticles } from '../../redux/SettingsSlice';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const AppInfoScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const buildNumber = Application.nativeBuildVersion;
    const appVersion = Application.nativeApplicationVersion;

    const showPointParticles = useAppSelector(state => state.settings.showPointParticles);
    const dispatch = useAppDispatch();
    const toggleSwitch = () => { dispatch(toggleshowPointParticles()); };

    const alertWithVersion = async () => {
        Alert.alert(`ScorePad with Rounds\n` +
            `v${appVersion} (${buildNumber})\n` +
            `${Platform.OS} ${Platform.Version}`
        );
        await analytics().logEvent('view_version');
    };

    return (
        <ScrollView style={{ backgroundColor: 'white', flex: 1 }}>
            <View style={[styles.paragraph, { alignItems: 'center' }]}>
                <RotatingIcon />
                <Text style={{ color: '#999' }} onPress={alertWithVersion}>
                    ScorePad with Rounds v{appVersion}
                </Text>
            </View>

            <View style={styles.paragraph}>
                <Text style={styles.header}>Settings</Text>
                <View style={styles.settingElement}>
                    <Text style={{ fontSize: 20 }}>
                        Point particle effect
                    </Text>
                    <Switch onValueChange={toggleSwitch} value={showPointParticles} />
                </View>
            </View>

            <View style={styles.paragraph}>
                <Text style={styles.header}>Instructions</Text>
                <Text style={styles.text}>
                    Tap the button below to view the onboarding tutorial.
                </Text>
                <Button title="View Tutorial" onPress={() => {
                    navigation.navigate('Tutorial');
                }} />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    paragraph: {
        flex: 1,
        margin: 20,
        padding: 20,
        alignContent: 'center',
        justifyContent: 'center',
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    text: {
        fontSize: 16,
        paddingVertical: 20,
    },
    settingElement: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    }
});

export default AppInfoScreen;
