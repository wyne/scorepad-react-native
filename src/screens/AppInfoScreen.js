import React, { memo } from 'react';
import { Text, View, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';
import { Platform } from 'react-native';
import { Image } from 'expo-image';

import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from 'react-native-elements';

const appJson = require('../../app.json');

const AppInfoScreen = ({ navigation }) => {
    const video = React.useRef(null);
    const [status, setStatus] = React.useState({});

    const buildNumber = Platform.OS == 'ios' ?
        appJson.expo.ios.buildNumber : appJson.expo.android.versionCode;
    const appVersion = appJson.expo.version;

    return (
        <SafeAreaView flex={1} edges={['left', 'right']} style={{ backgroundColor: 'white' }}>
            <ScrollView>
                <View style={{ alignItems: 'center' }}>
                    <Image source={require('../../assets/icon.png')}
                        resizeMode={'contain'}
                        resizeMethod={'resize'}
                        style={{
                            alignSelf: 'center',
                            height: 100,
                            width: 100,
                            margin: 10,
                            borderRadius: 20,
                        }}
                    />
                    <Text style={{ padding: 20, color: '#999' }} onPress={() => {
                        Alert.alert(`ScorePad with Rounds\n` +
                            `v${appVersion} (${buildNumber})\n` +
                            `${Platform.OS} ${Platform.Version}`
                        );
                    }}>
                        ScorePad with Rounds v{appVersion}
                    </Text>

                </View>
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
                    <View style={styles.buttons}>
                        <Button
                            title={status.isPlaying ? 'Pause' : 'Watch video tutorial'}
                            onPress={() =>
                                status.isPlaying ? video.current.pauseAsync() : video.current.playAsync()
                            }
                        />
                    </View>
                    <Video
                        ref={video}
                        style={styles.video}
                        source={
                            require('../../assets/video/tutorial.mp4')
                        }
                        useNativeControls
                        resizeMode="contain"
                        onPlaybackStatusUpdate={status => setStatus(() => status)}
                    />
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
    },
    video: {
        alignSelf: 'center',
        width: 140,
        height: 300,
    }
});

export default AppInfoScreen;
