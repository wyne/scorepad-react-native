import React from 'react';
import {
    View, StyleSheet,
    Dimensions,
    Animated as RNAnimated,
    Text,
    ViewToken,
    ImageURISource,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ExpandingDot } from "react-native-animated-pagination-dots";
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../Navigation';
import { Button } from 'react-native-elements';
import SkipButton from '../components/Onboarding/SkipButton';

const { width } = Dimensions.get('screen');

type OnboardingScreenItem = {
    title: string;
    image: ImageURISource;
    imageHeight?: number;
    imageWidth?: number;
    description: string;
    backgroundColor: string;
};

type OnboardingScreenItemProps = {
    item: OnboardingScreenItem;
    index: number;
};

const data: OnboardingScreenItem[] = [
    {
        title: "ScorePad\nwith Rounds",
        image: require('../../assets/icon.png'),
        imageHeight: 150,
        imageWidth: 150,
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
        description: 'Use rounds for score history. \nTap the < and > buttons to cycle rounds.',
        //yellow
        backgroundColor: '#f0c330',
    },
    {
        title: "That's it!",
        image: require('../../assets/icon.png'),
        imageHeight: 150,
        imageWidth: 150,
        description: 'Return to this tutorial \n at any time.',
        backgroundColor: '#3475B1',
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
        return (
            <View style={[styles.itemContainer]}>
                <Animated.View style={[styles.titleContainer]}>
                    <Text style={[styles.title]}>{item.title}</Text>
                </Animated.View>

                <Animated.View style={[styles.imageContainer]}>
                    <RNAnimated.Image source={item.image}
                        style={{
                            width: item.imageWidth || '100%',
                            height: item.imageHeight || '100%',
                            borderRadius: (
                                index == 0 || index == data.length - 1
                            ) ? 40 : 0,
                            resizeMode: 'contain',
                        }} />
                </Animated.View>

                <Animated.View style={[styles.descriptionContainer]}>
                    <Text style={[styles.description]}>
                        {item.description}
                    </Text>
                    <View style={{ alignContent: 'center' }}>
                        {index === data.length - 1 &&
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
                <SkipButton
                    visible={activeIndex !== data.length - 1}
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
