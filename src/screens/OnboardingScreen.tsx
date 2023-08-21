import React from 'react';
import {
    View, StyleSheet,
    Dimensions,
    Animated,
    Text,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
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
        title: "ScorePad with Rounds",
        image: '../../assets/icon.png',
        description: '« Swipe left to begin «',
        backgroundColor: '#3475B1',
    },
    {
        title: "Add Points",
        image: '../../assets/icon.png',
        description: 'Tap the top half of a player’s tile to add points.',
        backgroundColor: '#7bcf6e',
    },
    {
        title: "Subtract Points",
        image: '../../assets/icon.png',
        description: 'Tap the bottom half of a player’s tile to subtract points.',
        backgroundColor: '#4654a7',
    },
    {
        title: "Adjust Point Values",
        image: '../../assets/icon.png',
        description: 'Adjust the point value by tapping on the point value selector.',
        backgroundColor: '#7370cf',
    },
    {
        title: "Change Round",
        image: '../../assets/icon.png',
        description: 'Use rounds to keep score history per round. Tap the > and < buttons to cycle through.',
        backgroundColor: '#db4747',
    },
    {
        title: "Edit Players",
        image: '../../assets/icon.png',
        description: '',
        backgroundColor: '#db4747',
    },
    {
        title: "Delete Game",
        image: '../../assets/icon.png',
        description: '',
        backgroundColor: '#db4747',
    },
    {
        title: "That's it!",
        image: '../../assets/icon.png',
        description: '',
        backgroundColor: '#db4747',
    },
];

const OnboardingScreen = () => {
    const scrollX = React.useRef(new Animated.Value(0)).current;
    const keyExtractor = React.useCallback((_: any, index: number) => index.toString(), []);
    //Current item index of flatlist
    const [activeIndex, setActiveIndex] = React.useState(0);
    const flatListRef = React.useRef<Animated.FlatList>(null);

    console.log(activeIndex);

    const gotoNextPage = React.useCallback((activeIndex: number) => {
        console.log(activeIndex)
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

    const skipToStart = () => {
        if (flatListRef.current === null) return;

        flatListRef.current.scrollToIndex({
            index: data.length - 1,
            animated: true,
        });
    };

    const skipToEnd = () => {
        if (flatListRef.current === null) return;

        flatListRef.current.scrollToIndex({
            index: data.length - 1,
            animated: true,
        });
    };

    //Flatlist props that calculates current item index
    const onViewRef = React.useRef(({ viewableItems }: any) => {
        setActiveIndex(viewableItems[0].index);
    });
    const viewConfigRef = React.useRef({ viewAreaCoveragePercentThreshold: 50 });

    const renderItem = React.useCallback(({ item }: OnboardingScreenItemProps) => {
        return (
            <View style={[styles.itemContainer]}>
                <Text style={{ fontSize: 30, marginBottom: 40 }}>{item.title}</Text>
                <Animated.Image
                    style={{
                        width: 200,
                        height: 200,
                        borderRadius: 20,
                        resizeMode: 'cover',
                    }}
                    source={require('../../assets/icon.png')}
                />
                <Text style={{ fontSize: 25, marginTop: 40 }}>
                    {item.description}
                </Text>
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
                        <Animated.View
                            key={index}
                            style={[
                                StyleSheet.absoluteFillObject,
                                { backgroundColor: item.backgroundColor, opacity: colorFade },
                            ]}
                        />
                    );
                })}
            </View>




            <TouchableOpacity onPress={skipToEnd}
                style={{ alignSelf: 'flex-end', margin: 10, }}>
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
            <Animated.FlatList
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
                onScroll={Animated.event(
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: {
        flexBasis: 100,
        flexDirection: 'row',
        borderColor: '#fff',
        borderWidth: 1,
    },
    button: {
        flex: 1,
        margin: 20,
        fontWeight: '700',
        borderColor: 'red',
        borderWidth: 1,
    },
    buttonText: {
        color: '#fff',
    },
});

export default OnboardingScreen;
