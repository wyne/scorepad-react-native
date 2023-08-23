import React from 'react';
import { Text, View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Platform } from 'react-native';
import * as Application from 'expo-application';
import analytics from '@react-native-firebase/analytics';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/routers';

import { SafeAreaView } from 'react-native-safe-area-context';
import RotatingIcon from '../components/AppInfo/RotatingIcon';
import VideoTutorial from '../components/AppInfo/VideoTutorial';
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
                    <Text style={{ padding: 10, color: '#999' }} onPress={async () => {
                        Alert.alert(`ScorePad with Rounds\n` +
                            `v${appVersion} (${buildNumber})\n` +
                            `${Platform.OS} ${Platform.Version}`
                        );
                        await analytics().logEvent('view_version');
                    }}>
                        ScorePad with Rounds v{appVersion}
                    </Text>
                </View>

                <Button title="View Tutorial" onPress={() => {
                    navigation.navigate('Tutorial');
                }
                } />
                <View style={styles.container}>
                    <Text style={{ fontWeight: 'bold', fontSize: 20, margin: 10 }}>Instructions</Text>
                    <Text style={styles.text}>
                        Tap the addend selector in the top right to cycle through the available addends.
                        +1, +5, +10, +20, and +50 points.
                    </Text>
                    <Text style={styles.text}>
                        Tap the top of a player's tile to increase their score by that amount.
                    </Text>
                    <Text style={styles.text}>
                        Tap the bottom of a player's tile to decrease their score by that amount.
                    </Text>
                    <Text style={styles.text}>
                        Advance rounds with the next round (&gt;) or previous round (&lt;) buttons.
                        You can also tap on a specific round in the score table below the player tiles.
                    </Text>
                    <Text style={styles.text}>
                        Long press a game on the home screen to delete it.
                    </Text>
                    <VideoTutorial />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        margin: 10,
        alignContent: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 16,
        margin: 10,
    }
});

export default AppInfoScreen;
