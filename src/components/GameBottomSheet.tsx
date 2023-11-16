import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { useAppSelector } from '../../redux/hooks';
import Rounds from '../components/Rounds';
import { selectGameById } from '../../redux/GamesSlice';
import { systemBlue } from '../constants';
import Animated, { Extrapolate, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Icon } from 'react-native-elements';

/**
 * Height of the bottom sheet
 */
export const bottomSheetHeight = 80;

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    containerHeight: number;
}

const GameBottomSheet: React.FunctionComponent<Props> = ({ navigation, containerHeight }) => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    if (typeof currentGameId == 'undefined') return null;

    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const currentGame = useAppSelector(state => selectGameById(state, state.settings.currentGameId));

    if (currentGame == undefined) return null;

    // ref
    const bottomSheetRef = useRef<BottomSheet>(null);

    // variables
    const snapPoints = useMemo(() => [bottomSheetHeight, '60%', '100%'], []);

    // State variable for the current snap point index
    const [, setSnapPointIndex] = useState(0);

    /**
     * Function to handle changes in the bottom sheet
     */
    const onSheetChange = useCallback((index: number) => {
        setSnapPointIndex(index);
    }, []);

    /**
     * Function to snap to the next point when the handle is pressed
     */
    const sheetTitlePress = () => {
        setSnapPointIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % snapPoints.length;
            bottomSheetRef.current?.snapToIndex(nextIndex);
            return nextIndex;
        });
    };

    /**
     * Animated position of the bottom sheet
     * Calculated as the difference between the current position and the first snap point
     */
    const animatedPosition = useSharedValue(0);

    /**
     * Animated style for the bottom sheet
     */
    const animatedSheetStyle = useAnimatedStyle(() => {
        const snapPoint0: number = typeof snapPoints[0] === 'string'
            ? parseFloat(snapPoints[0]) / 100 * containerHeight
            : containerHeight - snapPoints[0];

        const delta = snapPoint0 - animatedPosition.value;

        const interpolatedValue = interpolate(
            delta,
            [0, 100], // Pixel distance
            [0, 1], // Opacity
            Extrapolate.CLAMP
        );

        return {
            opacity: interpolatedValue
        };
    });

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={0}
            onChange={onSheetChange}
            snapPoints={snapPoints}
            backgroundStyle={{ backgroundColor: 'rgb(30,40,50)' }}
            handleIndicatorStyle={{ backgroundColor: 'white' }}
            animatedPosition={animatedPosition}
        >
            <BottomSheetScrollView >
                <SafeAreaView edges={['right', 'left']}>
                    <View style={styles.sheetHeaderContainer}>
                        <Text style={[styles.sheetHeader]} numberOfLines={1} onPress={() => sheetTitlePress()}>
                            {currentGame.title}
                        </Text>
                        <Text style={styles.sheetHeaderButton} onPress={() => navigation.navigate('Settings')}>
                            Edit
                        </Text>
                    </View>

                    <Animated.View style={[styles.sheetContent, animatedSheetStyle]}>
                        <Rounds navigation={navigation} show={!fullscreen} />
                        <Text style={{ color: 'white' }}>
                            Tap on a column to set the current round.
                        </Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 }}>
                            <TouchableOpacity onPress={() => navigation.navigate('Share')}>
                                <View style={[styles.shareButton]}>
                                    <Icon name="share-outline" type="ionicon" size={30} color={systemBlue} />
                                    <Text style={{ color: systemBlue, fontSize: 15, paddingTop: 5 }}>Share</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </SafeAreaView>
            </BottomSheetScrollView>
        </BottomSheet>
    );
};

const styles = StyleSheet.create({
    sheetHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    sheetHeader: {
        color: 'white',
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        paddingHorizontal: 10,
        paddingTop: 0,
    },
    sheetHeaderButton: {
        color: systemBlue,
        fontSize: 20,
        paddingHorizontal: 10,
    },
    sheetContent: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    shareButton: {
        margin: 5,
        padding: 10,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,.2)',
        borderRadius: 10,
        alignItems: 'center'
    },
});

export default GameBottomSheet;
