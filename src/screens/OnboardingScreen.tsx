import React from 'react';
import {
    View, StyleSheet,
    Dimensions,
    Animated as RNAnimated,
    Text,
    TouchableOpacity,
    ViewToken,
    ImageURISource,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { ExpandingDot } from "react-native-animated-pagination-dots";
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

const { width } = Dimensions.get('screen');

type OnboardingScreenItem = {
    title: string;
    image: ImageURISource;
    description: string;
    backgroundColor: string;
};

type OnboardingScreenItemProps = {
    item: OnboardingScreenItem;
};

const data: OnboardingScreenItem[] = [
    {
        title: "ScorePad\nwith Rounds",
        image: require('../../assets/icon.png'),
        description: '« Swipe left to begin «',
        backgroundColor: '#3475B1',
    },
    {
        title: "Add Points",
        image: require('../../assets/onboarding/add.png'),
        description: 'Tap the top half of a player’s tile to add points.',
        backgroundColor: '#7bcf6e',
    },
    {
        title: "Subtract Points",
        image: require('../../assets/onboarding/subtract.png'),
        description: 'Tap the bottom half of a player’s tile to subtract points.',
        backgroundColor: '#db4747',
    },
    {
        title: "Adjust Point Values",
        image: require('../../assets/onboarding/multiplier.png'),
        description: 'Adjust the point value by tapping on the point value selector.',
        backgroundColor: '#7370cf',
    },
    {
        title: "Change Round",
        image: require('../../assets/onboarding/rounds.png'),
        description: 'Use rounds to keep score history per round. Tap the > and < buttons to cycle through.',
        backgroundColor: '#db4747',
    },
    {
        title: "That's it!",
        image: require('../../assets/icon.png'),
        description: 'Return to this tutorial anytime with the Info button in the top left.',
        backgroundColor: '#db4747',
    },
];

export interface Props {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding' | 'Tutorial'>;
    route: RouteProp<RootStackParamList, 'Onboarding' | 'Tutorial'>;
}

const OnboardingScreen: React.FunctionComponent<Props> = ({ navigation, route }) => {
    const { onboarding = false } = route.params;

    const scrollX = React.useRef(new RNAnimated.Value(0)).current;
    const keyExtractor = React.useCallback((_: OnboardingScreenItem, index: number) => index.toString(), []);
    //Current item index of flatlist
    const [activeIndex, setActiveIndex] = React.useState<number>(0);
    const flatListRef = React.useRef<RNAnimated.FlatList>(null);

    const closeOnboarding = React.useCallback(() => {
        if (onboarding) navigation.navigate('List');
        else navigation.goBack();
    }, []);

    const gotoNextPage = React.useCallback((activeIndex: number) => {
        if (activeIndex === data.length - 1) {
            closeOnboarding();
            return;
        }

        if (activeIndex + 1 < data.length) {
            if (flatListRef.current === null) return;

            flatListRef.current.scrollToIndex({
                index: activeIndex + 1,
                animated: false,
            });
        }
    }, [activeIndex, flatListRef.current]);

    const gotoPrevPage = React.useCallback((activeIndex: number) => {
        if (flatListRef.current === null) return;

        if (activeIndex !== 0) {
            flatListRef.current.scrollToIndex({
                index: activeIndex - 1,
                animated: false,
            });
        }
    }, [activeIndex, flatListRef.current]);

    type ViewableItemsChangedProps = {
        viewableItems: ViewToken[];
    };

    // Flatlist props that calculates current item index
    const onViewRef = React.useRef(({ viewableItems }: ViewableItemsChangedProps) => {
        if (viewableItems[0].index === null) return;
        setActiveIndex(viewableItems[0].index);
    });

    const viewConfigRef = React.useRef({ viewAreaCoveragePercentThreshold: 50 });

    const renderItem = React.useCallback(({ item }: OnboardingScreenItemProps) => {
        return (
            <View style={[styles.itemContainer]}>
                <Animated.View
                    style={{
                        flexBasis: '15%',
                        justifyContent: 'flex-end',
                        flexGrow: 0,
                    }}>
                    <Text style={{
                        fontSize: 30,
                        fontWeight: 'bold',
                        textAlign: 'center',
                    }}>{item.title}</Text>
                </Animated.View>
                <Animated.View
                    style={{
                        flexGrow: 0,
                        flexBasis: '50%',
                        alignContent: 'center',
                        justifyContent: 'center',
                    }}>
                    <RNAnimated.Image
                        style={{
                            width: 350,
                            height: 250,
                            // borderRadius: 20,
                            resizeMode: 'contain',
                        }}
                        source={item.image}
                    />
                </Animated.View>
                <Animated.View
                    style={{
                        flex: 1,
                        flexGrow: 1,
                        padding: 20
                    }}>
                    <Text style={{ fontSize: 25, textAlign: 'center' }}>
                        {item.description}
                    </Text>
                </Animated.View>
                <TouchableOpacity onPress={() => gotoPrevPage(activeIndex)} style={{
                    position: 'absolute', left: '0%', width: '50%', height: '100%'
                }} />
                <TouchableOpacity onPress={() => gotoNextPage(activeIndex)} style={{
                    position: 'absolute', left: '50%', width: '50%', height: '100%'
                }} />
            </View>
        );
    }, [activeIndex]);

    return (
        <View style={[styles.container]}>
            <SafeAreaView edges={(onboarding ? ['top', 'bottom'] : [])}>
                <View style={[StyleSheet.absoluteFillObject]}>
                    {data.map((item, index) => {
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
                            <RNAnimated.View
                                key={index}
                                style={[
                                    StyleSheet.absoluteFillObject,
                                    { backgroundColor: item.backgroundColor, opacity: colorFade },
                                ]}
                            />
                        );
                    })}
                </View>

                <RNAnimated.FlatList
                    ref={flatListRef}
                    onViewableItemsChanged={onViewRef.current}
                    viewabilityConfig={viewConfigRef.current}
                    data={data}
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
                    data={data}
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
                <SafeAreaView pointerEvents='box-none' edges={['top', 'bottom']}
                    style={[StyleSheet.absoluteFill]}>
                    <View pointerEvents='box-none' style={{ alignItems: 'flex-end' }}>
                        <TouchableOpacity
                            style={{ padding: 10 }}
                            onPress={closeOnboarding}>
                            <View style={{
                                padding: 10,
                                borderRadius: 20,
                                borderColor: '#fff',
                                backgroundColor: 'rgba(255, 255, 255, .2)',
                            }}>
                                <Text style={{ fontSize: 20, color: '#fff', }}>
                                    Skip
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            }
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContainer: {
        flex: 1,
        width: width,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    button: {
        flex: 1,
        margin: 20,
        fontWeight: '700',
    },
    buttonText: {
        color: '#fff',
    },
});

export default OnboardingScreen;
