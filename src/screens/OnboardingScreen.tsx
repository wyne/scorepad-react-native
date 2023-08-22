import React from 'react';
import {
    View, StyleSheet,
    Dimensions,
    Animated as RNAnimated,
    Text,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
import Animated, { FadeInUp, SlideInDown } from 'react-native-reanimated';
import { ExpandingDot } from "react-native-animated-pagination-dots";

const { width } = Dimensions.get('screen');

type OnboardingScreenItem = {
    title: string;
    image: string;
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
        image: require('../../assets/onboarding/add.jpg'),
        description: 'Tap the top half of a player’s tile to add points.',
        backgroundColor: '#7bcf6e',
    },
    {
        title: "Subtract Points",
        image: require('../../assets/onboarding/subtract.jpg'),
        description: 'Tap the bottom half of a player’s tile to subtract points.',
        backgroundColor: '#4654a7',
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
        title: "Edit Players",
        image: require('../../assets/icon.png'),
        description: '',
        backgroundColor: '#db4747',
    },
    {
        title: "Delete Game",
        image: require('../../assets/icon.png'),
        description: '',
        backgroundColor: '#db4747',
    },
    {
        title: "That's it!",
        image: require('../../assets/icon.png'),
        description: 'Return to this tutorial anytime with the Info button in the top left.',
        backgroundColor: '#db4747',
    },
];

const OnboardingScreen = () => {
    const scrollX = React.useRef(new RNAnimated.Value(0)).current;
    const keyExtractor = React.useCallback((_: any, index: number) => index.toString(), []);
    //Current item index of flatlist
    const [activeIndex, setActiveIndex] = React.useState(0);
    const flatListRef = React.useRef<RNAnimated.FlatList>(null);

    const gotoNextPage = React.useCallback((activeIndex: number) => {
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

    //Flatlist props that calculates current item index
    const onViewRef = React.useRef(({ viewableItems }: any) => {
        setActiveIndex(viewableItems[0].index);
    });
    const viewConfigRef = React.useRef({ viewAreaCoveragePercentThreshold: 50 });

    const renderItem = React.useCallback(({ item }: OnboardingScreenItemProps) => {
        return (
            <View style={[styles.itemContainer]}>
                <Animated.View
                    // entering={FadeInUp.duration(500).delay(100)}
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
                    // entering={FadeInUp.duration(500).delay(200)}
                    style={{
                        flexGrow: 0,
                        flexBasis: '50%',
                        // borderWidth: 1,
                        // borderColor: '#fff',
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
                    // entering={FadeInUp.duration(500).delay(300)}
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
            <StatusBar hidden />
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

            {/* Skip Button */}
            <TouchableOpacity onPress={() => { }}
                style={{ position: 'absolute', top: '1%', right: '1%', margin: 10, }}>
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

        </View>
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
