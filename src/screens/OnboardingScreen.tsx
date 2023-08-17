import React from 'react';
import {
    View, StyleSheet,
    Dimensions,
    Animated,
    TouchableOpacity,
    Text,
    StatusBar,
} from 'react-native';
import { ExpandingDot } from "react-native-animated-pagination-dots";

const { width } = Dimensions.get('screen');

const data = [
    {
        image:
            'https://cdn.dribbble.com/users/3281732/screenshots/13661330/media/1d9d3cd01504fa3f5ae5016e5ec3a313.jpg?compress=1&resize=1200x1200',
        backgroundColor: '#7bcf6e',
    },
    {
        image:
            'https://cdn.dribbble.com/users/3281732/screenshots/11192830/media/7690704fa8f0566d572a085637dd1eee.jpg?compress=1&resize=1200x1200',
        backgroundColor: '#4654a7',
    },
    {
        image:
            'https://cdn.dribbble.com/users/3281732/screenshots/9165292/media/ccbfbce040e1941972dbc6a378c35e98.jpg?compress=1&resize=1200x1200',
        backgroundColor: '#7370cf',
    },
    {
        image:
            'https://cdn.dribbble.com/users/3281732/screenshots/11205211/media/44c854b0a6e381340fbefe276e03e8e4.jpg?compress=1&resize=1200x1200',
        backgroundColor: '#db4747',
    },
];

const OnboardingScreen = () => {
    const scrollX = React.useRef(new Animated.Value(0)).current;
    const keyExtractor = React.useCallback((_, index) => index.toString(), []);
    //Current item index of flatlist
    const [activeIndex, setActiveIndex] = React.useState(0);
    let flatListRef = React.useRef(null);
    const gotoNextPage = () => {
        if (activeIndex + 1 < data.length) {
            flatListRef.current.scrollToIndex({
                index: activeIndex + 1,
                animated: true,
            });
        }
    };
    const gotoPrevPage = () => {
        if (activeIndex !== 0) {
            flatListRef.current.scrollToIndex({
                index: activeIndex - 1,
                animated: true,
            });
        }
    };
    const skipToStart = () => {
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
    const renderItem = React.useCallback(({ item }) => {
        return (
            <View style={[styles.itemContainer]}>
                <Animated.Image
                    style={{
                        width: 200,
                        height: 200,
                        borderRadius: 20,
                        resizeMode: 'cover',
                    }}
                    source={{ uri: item.image }}
                />
            </View>
        );
    }, []);

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
                // dotSize={18}
                // dotSpacing={6}
                // lineDistance={7}
                // lineHeight={4}
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
            {/* <View style={[styles.buttonContainer]}>
                <TouchableOpacity
                    style={[styles.button]}
                    onPress={() => gotoPrevPage()}
                >
                    <Text style={[styles.buttonText]}>Previous</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button]}
                    onPress={() => gotoNextPage()}
                >
                    <Text style={[styles.buttonText]}>Next</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button]} onPress={() => skipToStart()}>
                    <Text style={[styles.buttonText]}>Skip</Text>
                </TouchableOpacity>
            </View> */}
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
        // borderColor: 'blue',
        // borderWidth: 1,
    },
    buttonContainer: {
        // flex: 1,
        // flexGrow: 0,
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