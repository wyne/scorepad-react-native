import React, { useEffect } from 'react';

import {
    ImageURISource,
    Animated as RNAnimated,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { Button } from 'react-native-elements';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';
import Video from 'react-native-video';

import { OnboardingScreenItem } from './Onboarding';

interface Props {
    active?: boolean;
    closeOnboarding: () => void;
    index: number;
    isLast: boolean;
    item: OnboardingScreenItem;
    width: number;
}

const SwipeHint: React.FC = () => {
    const offset = useSharedValue(0);

    useEffect(() => {
        offset.value = withRepeat(
            withTiming(-12, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: offset.value }],
    }));

    return (
        <Animated.View style={animatedStyle}>
            <Text style={{ fontSize: 48, color: 'rgba(0,0,0,0.3)', textAlign: 'center' }}>‹</Text>
        </Animated.View>
    );
};

const OnboardingPage: React.FC<Props> = React.memo(({
    active = false,
    closeOnboarding,
    isLast,
    item,
    width,
}) => {
    let media;
    switch (item.media.type) {
        case 'image':
            media = (
                <RNAnimated.Image source={item.media.source as ImageURISource}
                    style={{
                        width: item.media.width || '100%',
                        height: item.media.height || '100%',
                        borderRadius: item.media.borderRadius || 0,
                        resizeMode: 'contain',
                    }} />
            );
            break;
        case 'video':
            media = (
                <View style={{
                    backgroundColor: 'black',
                    padding: 5,
                    width: item.media.width || '100%',
                    height: item.media.height || '100%',
                    borderRadius: 10,
                }}>
                    <Video
                        source={{ uri: item.media.source as unknown as string }}
                        paused={!active}
                        repeat={true}
                        resizeMode='contain'
                        style={{
                            width: '100%',
                            height: '100%',
                        }}
                    />
                </View>
            );
            break;
    }

    return (
        <View style={[styles.itemContainer, { width: width }]} >
            <Animated.View style={[styles.titleContainer]}>
                <Text style={[styles.title]}>{item.title}</Text>
            </Animated.View>

            <Animated.View style={[styles.imageContainer]}>
                {media}
            </Animated.View>

            <Animated.View style={[styles.descriptionContainer]}>
                {item.swipeHint ? (
                    <View style={styles.swipeHintContainer}>
                        <Text style={styles.swipeHintText}>Swipe left to begin</Text>
                        <SwipeHint />
                    </View>
                ) : (
                    <Text style={[styles.description, { color: item.color }]}>
                        {item.description}
                    </Text>
                )}
                <View style={{ alignContent: 'center' }}>
                    {isLast &&
                        <Button
                            title="Get Started"
                            titleStyle={{ color: 'black' }}
                            onPress={closeOnboarding}
                            buttonStyle={[styles.finishButton]}
                            type='outline'
                            accessibilityLabel="Get started"
                            accessibilityRole="button"
                        />
                    }
                </View>
            </Animated.View>
        </View>
    );
});

export default OnboardingPage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    itemContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    titleContainer: {
        height: '15%',
        justifyContent: 'flex-end',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    imageContainer: {
        height: '40%',
        justifyContent: 'center',
        alignItems: 'center',
        width: '80%',
        padding: 20,
    },
    descriptionContainer: {
        height: '25%',
        justifyContent: 'flex-start',
        padding: 20,
    },
    description: {
        fontSize: 25,
        textAlign: 'center',
    },
    finishButton: {
        borderColor: 'black',
        borderWidth: 1,
        borderRadius: 20,
        padding: 10,
        margin: 15,
    },
    swipeHintContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    swipeHintText: {
        fontSize: 17,
        color: 'rgba(0,0,0,0.5)',
    },
});
