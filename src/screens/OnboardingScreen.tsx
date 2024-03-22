import React from 'react';

import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    Dimensions,
    ImageURISource,
    Animated as RNAnimated,
    StyleSheet,
    Text,
    View,
    ViewToken,
} from 'react-native';
import { ExpandingDot } from "react-native-animated-pagination-dots";
import { Button } from 'react-native-elements';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import { parse, SemVer } from 'semver';

import { useAppSelector } from '../../redux/hooks';
import { getOnboardingScreens, OnboardingScreenItem } from '../components/Onboarding/Onboarding';
import SkipButton from '../components/Onboarding/SkipButton';
import { RootStackParamList } from '../Navigation';

const { width } = Dimensions.get('screen');

type OnboardingScreenItemProps = {
    item: OnboardingScreenItem;
    index: number;
};

export interface Props {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding' | 'Tutorial'>;
    route: RouteProp<RootStackParamList, 'Onboarding' | 'Tutorial'>;
}

const OnboardingScreen: React.FunctionComponent<Props> = ({ navigation, route }) => {
    const { onboarding = false } = route.params;

    const onboardedStr = useAppSelector(state => state.settings.onboarded);
    const onboardedSemVer = parse(onboardedStr);

    console.log(onboardedSemVer);
    const onboardingScreens: OnboardingScreenItem[] = getOnboardingScreens(onboarding ? onboardedSemVer || new SemVer('0.0.0') : new SemVer('0.0.0'));

    const scrollX = React.useRef(new RNAnimated.Value(0)).current;
    const keyExtractor = React.useCallback((_: OnboardingScreenItem, index: number) => index.toString(), []);

    // Current item index of flatlist
    const [activeIndex, setActiveIndex] = React.useState<number>(0);
    const flatListRef = React.useRef<RNAnimated.FlatList>(null);

    const closeOnboarding = React.useCallback(() => {
        if (onboarding) navigation.navigate('List');
        else navigation.goBack();
    }, []);

    type ViewableItemsChangedProps = {
        viewableItems: ViewToken[];
    };

    // Flatlist props that calculates current item index
    const onViewRef = React.useRef(({ viewableItems }: ViewableItemsChangedProps) => {
        if (viewableItems[0].index === null) return;
        setActiveIndex(viewableItems[0].index);
    });

    const viewConfigRef = React.useRef({ viewAreaCoveragePercentThreshold: 50 });

    const renderItem = React.useCallback(({ item, index }: OnboardingScreenItemProps) => {

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
                            paused={index != activeIndex}
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
            <View style={[styles.itemContainer]}>
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
                        {index === onboardingScreens.length - 1 &&
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
    }, [activeIndex]);

    return (
        <Animated.View style={[styles.container]} entering={FadeIn} testID={'onboarding'}>
            <SafeAreaView edges={(['top', 'bottom'])} style={onboarding ? { paddingTop: 40 } : {}}>
                <View style={[StyleSheet.absoluteFillObject]}>
                    {onboardingScreens.map((item, index) => {
                        const inputRange = [
                            (index - 1) * width,
                            index * width,
                            (index + 1) * width,
                        ];
                        const colorFade = scrollX.interpolate({
                            inputRange,
                            outputRange: [0, 1, 0],
                        });
                        return (
                            <RNAnimated.View key={index}
                                style={[
                                    StyleSheet.absoluteFillObject,
                                    {
                                        backgroundColor: item.backgroundColor,
                                        opacity: colorFade
                                    },
                                ]}
                            />
                        );
                    })}
                </View>

                <RNAnimated.FlatList
                    ref={flatListRef}
                    onViewableItemsChanged={onViewRef.current}
                    viewabilityConfig={viewConfigRef.current}
                    data={onboardingScreens}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    horizontal
                    decelerationRate={'normal'}
                    scrollEventThrottle={16}
                    onScroll={RNAnimated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        {
                            useNativeDriver: false,
                        }
                    )}
                />

                <ExpandingDot
                    data={onboardingScreens}
                    scrollX={scrollX}
                    expandingDotWidth={30}
                    dotStyle={{
                        width: 10,
                        height: 10,
                        backgroundColor: '#347af0',
                        borderRadius: 5,
                        marginHorizontal: 5
                    }}
                    inActiveDotOpacity={0.2}
                    activeDotColor={'#fff'}
                    containerStyle={{ flex: 1 }}
                />

            </SafeAreaView>

            {onboarding &&
                <SkipButton
                    visible={activeIndex !== onboardingScreens.length - 1}
                    onPress={closeOnboarding}
                />
            }
        </Animated.View >
    );
};

const borders = false;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContainer: {
        flex: 1,
        width: width,
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    titleContainer: {
        height: '15%',
        justifyContent: 'flex-end',
        borderWidth: borders ? 1 : 0,
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
        borderWidth: borders ? 1 : 0,
    },
    descriptionContainer: {
        height: '25%',
        justifyContent: 'flex-start',
        padding: 20,
        borderWidth: borders ? 1 : 0,
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

export default OnboardingScreen;
