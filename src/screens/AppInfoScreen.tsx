import React from 'react';
import { Text, View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import analytics from '@react-native-firebase/analytics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/routers';

import { SafeAreaView } from 'react-native-safe-area-context';
import RotatingIcon from '../components/AppInfo/RotatingIcon';
import { Button } from 'react-native-elements';

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const AppInfoScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const buildNumber = Application.nativeBuildVersion;
    const appVersion = Application.nativeApplicationVersion;

    return (
        <SafeAreaView edges={['left', 'right']} style={{ backgroundColor: 'white', flex: 1 }}>
            <ScrollView>
                <View style={{ alignItems: 'center' }}>
                    <RotatingIcon />
                    <Text style={{ padding: 20, color: '#999' }} onPress={async () => {
                        Alert.alert(`ScorePad with Rounds\n` +
                            `v${appVersion} (${buildNumber})\n` +
                            `${Platform.OS} ${Platform.Version}`
                        );
                        await analytics().logEvent('view_version');
                    }}>
                        ScorePad with Rounds v{appVersion}
                    </Text>
                </View>

                <View style={styles.container}>
                    <Text style={{ fontWeight: 'bold', fontSize: 20, margin: 10 }}>Instructions</Text>
                    <Text style={styles.text}>
                        Tap the button below to view the onboarding tutorial.
                    </Text>
                    <Button title="View Tutorial" onPress={() => {
                        navigation.navigate('Tutorial');
                    }
                    } />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: 20,
        alignContent: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 16,
        margin: 10,
    }
});

export default AppInfoScreen;
