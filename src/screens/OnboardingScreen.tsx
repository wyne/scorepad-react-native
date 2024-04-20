import React from 'react';

import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    Animated as RNAnimated,
    StyleSheet,
    View,
    ViewToken
} from 'react-native';
import { ExpandingDot } from 'react-native-animated-pagination-dots';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SemVer } from 'semver';

import { getOnboardingScreens, OnboardingScreenItem } from '../components/Onboarding/Onboarding';
import OnboardingPage from '../components/Onboarding/OnboardingPage';
import SkipButton from '../components/Onboarding/SkipButton';
import { RootStackParamList } from '../Navigation';

export interface Props {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding' | 'Tutorial'>;
    route: RouteProp<RootStackParamList, 'Onboarding' | 'Tutorial'>;
}

const OnboardingScreen: React.FunctionComponent<Props> = ({ navigation, route }) => {
    const [width, setWidth] = React.useState(0);

    const {
        onboarding = false,
        version = new SemVer('0.0.0')
    } = route.params;

    const onboardingScreens: OnboardingScreenItem[] = getOnboardingScreens(onboarding ? version || new SemVer('0.0.0') : new SemVer('0.0.0'));

    const scrollX = React.useRef(new RNAnimated.Value(0)).current;
    const keyExtractor = React.useCallback((_: OnboardingScreenItem, index: number) => index.toString(), []);

    // Current item index of flatlist
    const [activeIndex, setActiveIndex] = React.useState<number>(0);

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

    return (
        <Animated.View style={[styles.container]} entering={FadeIn}
            onLayout={event => {
                const { width } = event.nativeEvent.layout;
                setWidth(width);
            }}>
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
                onViewableItemsChanged={onViewRef.current}
                viewabilityConfig={viewConfigRef.current}
                data={onboardingScreens}
                renderItem={({ item, index }) =>
                    <OnboardingPage
                        closeOnboarding={closeOnboarding}
                        index={index}
                        item={item}
                        width={width}
                        active={index === activeIndex}
                        isLast={index === onboardingScreens.length - 1}
                    />
                }
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

            <SkipButton
                visible={activeIndex !== onboardingScreens.length - 1}
                onPress={closeOnboarding}
            />
        </Animated.View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
});

export default OnboardingScreen;
