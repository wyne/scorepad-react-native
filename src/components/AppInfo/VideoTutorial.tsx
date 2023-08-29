import React, { useState, useRef, useCallback } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { AVPlaybackStatus, AVPlaybackStatusSuccess, Video } from 'expo-av';
import analytics from '@react-native-firebase/analytics';

function isAVPlaybackStatusSuccess(param: AVPlaybackStatus): param is AVPlaybackStatusSuccess {
    return (param as AVPlaybackStatusSuccess).isPlaying !== undefined;
}

const VideoTutorial = () => {
    const videoRef = useRef<Video>(null);
    const [videoStatus, setVideoStatus] = useState<AVPlaybackStatus>({
        isPlaying: false,
        didJustFinish: false,
    } as AVPlaybackStatusSuccess);

    const handlePress = useCallback(async () => {
        if (videoRef?.current) {
            videoRef.current.presentFullscreenPlayer();
            videoRef.current.replayAsync();
        }
        await analytics().logEvent('watch_tutorial');
    }, [videoRef]);

    const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
        if (isAVPlaybackStatusSuccess(status)) {
            setVideoStatus(status);
            if (status.didJustFinish) {
                videoRef?.current?.dismissFullscreenPlayer();
            }
        } else {
            // handle error
        }
    }, [videoRef]);

    return <View>
        <Button
            title={isAVPlaybackStatusSuccess(videoStatus) && videoStatus.isPlaying ?
                'Pause' : 'Watch video tutorial'}
            onPress={handlePress}
        />
        <Video ref={videoRef}
            style={styles.video}
            source={require('../../../assets/video/tutorial.mp4')}
            useNativeControls
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
    </View>;
};

const styles = StyleSheet.create({
    video: {
        alignSelf: 'center',
        width: 0,
        height: 0,
    }
});


export default VideoTutorial;
