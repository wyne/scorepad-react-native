import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

/**
 * Height of the bottom sheet
 */
export const bottomSheetHeight = 90;

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

    // callbacks
    const handleSheetChanges = useCallback((index: number) => {
        console.log('handleSheetChanges', index);
    }, []);

    // State variable for the current snap point index
    const [snapPointIndex, setSnapPointIndex] = useState(1);

    // Function to cycle through the snap points
    const cycleSnapPoints = () => {
        setSnapPointIndex((prevIndex) => {
            const nextIndex = prevIndex + 1;
            return nextIndex < snapPoints.length ? nextIndex : 0;
        });
    };

    // Function to snap to the next point when the button is pressed
    const handleButtonPress = () => {
        cycleSnapPoints();
        bottomSheetRef.current?.snapToIndex(snapPointIndex);
    };

    const animatedPosition = useSharedValue(0);

    const newStyles = useAnimatedStyle(() => {
        const snapPoint0: number = typeof snapPoints[0] === 'string'
            ? parseFloat(snapPoints[0]) / 100 * containerHeight
            : containerHeight - snapPoints[0];

        const delta = snapPoint0 - animatedPosition.value;

        const i = interpolate(delta, [0, 30], [0, 1], Extrapolate.CLAMP);
        console.log("i", i);

        return {
            opacity: i
        };
    });

    return (

        <BottomSheet
            ref={bottomSheetRef}
            index={0}
            snapPoints={snapPoints}
            onChange={handleSheetChanges}
            backgroundStyle={{ backgroundColor: 'rgb(30,40,50)' }}
            handleIndicatorStyle={{ backgroundColor: 'white' }}
            animatedPosition={animatedPosition}
        >
            <BottomSheetScrollView >
                <SafeAreaView edges={['right', 'left']}>
                    <View style={styles.sheetHeaderContainer}>
                        <Text style={styles.sheetHeader} onPress={() => handleButtonPress()}>
                            {currentGame.title}
                        </Text>
                        <Text style={styles.sheetHeaderButton} onPress={() => navigation.navigate('Settings')}>
                            Edit
                        </Text>
                    </View>

                    <Animated.View style={[styles.sheetContent, newStyles]}>
                        <Rounds navigation={navigation} show={!fullscreen} />
                        <Text style={{ color: 'white' }}>
                            Tap on a column to set the current round.
                        </Text>
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
        fontSize: 20,
        paddingTop: 0,
        fontWeight: 'bold'
    },
    sheetHeaderButton: {
        paddingHorizontal: 20,
        fontSize: 20,
        color: systemBlue,
    },
    sheetContent: {
        padding: 10,
    },
});

export default GameBottomSheet;
