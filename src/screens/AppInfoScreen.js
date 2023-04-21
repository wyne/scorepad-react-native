import React, { memo } from 'react';
import { Text, View, Button, StyleSheet, Alert, ScrollView, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';
import { Platform } from 'react-native';
import { Image } from 'expo-image';
import * as Application from 'expo-application';
import analytics from '@react-native-firebase/analytics';

import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FlipInEasyX, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const AppInfoScreen = ({ navigation }) => {
    const video = React.useRef(null);
    const [status, setStatus] = React.useState({});

    const buildNumber = Application.nativeBuildVersion;
    const appVersion = Application.nativeApplicationVersion;

    const rotation = useSharedValue(0);
    const rotationCount = useSharedValue(0);
    const animatedStyles = useAnimatedStyle(() => {
        return {
            transform: [
                { rotate: rotation.value + 'deg' },
            ],
        };
    });

    return (
        <SafeAreaView flex={1} edges={['left', 'right']} style={{ backgroundColor: 'white' }}>
            <ScrollView>
                <View style={{ alignItems: 'center' }}>
                    <TouchableWithoutFeedback onPress={async () => {
                        rotationCount.value = rotationCount.value + 1;
                        rotation.value = withTiming((rotationCount.value * 90), { duration: 1000 });

                        await analytics().logEvent('app_icon');
                    }}>
                        <Animated.View style={[animatedStyles]} entering={FlipInEasyX.delay(0).duration(1000)}>
                            <Image source={require('../../assets/icon.png')}
                                contentFit='contain'
                                resizeMethod='resize'
                                style={{
                                    alignSelf: 'center',
                                    height: 100,
                                    width: 100,
                                    margin: 10,
                                    borderRadius: 20,
                                }}
                            />
                        </Animated.View>
                    </TouchableWithoutFeedback>
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
                            onPress={async () => {
                                video.current.presentFullscreenPlayer();
                                video.current.replayAsync();

                                await analytics().logEvent('watch_tutorial');
                            }}
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
                        onPlaybackStatusUpdate={status => {
                            setStatus(() => status);
                            if (status.didJustFinish) {
                                video.current.dismissFullscreenPlayer();
                            }
                        }}
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
        width: 0,
        height: 0,
    }
});

export default AppInfoScreen;
