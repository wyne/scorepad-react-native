import React from 'react';

import {
    ImageURISource,
    Animated as RNAnimated,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { Button } from 'react-native-elements';
import Animated from 'react-native-reanimated';
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
                        source={item.media.source as number}
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
                <Text style={[styles.description, { color: item.color }]}>
                    {item.description}
                </Text>
                <View style={{ alignContent: 'center' }}>
                    {isLast &&
                        <Button
                            title="Get Started"
                            titleStyle={{ color: 'black' }}
                            onPress={closeOnboarding}
                            buttonStyle={[styles.finishButton]}
                            type='outline'
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
        borderRadius: 20,
        padding: 10,
        margin: 15,
    },
});
