import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase } from '@react-navigation/native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetScrollView } from '@gorhom/bottom-sheet';

import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import Rounds from '../components/Rounds';
import { selectGameById, updateGame } from '../../redux/GamesSlice';
import { systemBlue } from '../constants';
import Animated, { Extrapolate, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
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

    const dispatch = useAppDispatch();

    /**
     * Lock the game
     */
    const setLock = () => dispatch(
        updateGame({
            id: currentGame.id,
            changes: {
                locked: !currentGame.locked,
            }
        })
    );

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

    const renderBackdrop = useCallback(
        (props: BottomSheetBackdropProps) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={0}
                appearsOnIndex={1}
                pressBehavior={0}
            />
        ),
        []
    );

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={0}
            onChange={onSheetChange}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: 'rgb(30,40,50)' }}
            handleIndicatorStyle={{ backgroundColor: 'white' }}
            animatedPosition={animatedPosition}
            enablePanDownToClose={false}
        >
            <BottomSheetScrollView >
                <SafeAreaView edges={['right', 'left']}>
                    <View style={styles.sheetHeaderContainer}>
                        <TouchableWithoutFeedback onPress={() => sheetTitlePress()}>
                            <View style={[styles.sheetTitleView]}>
                                <Text style={[styles.sheetTitle]} numberOfLines={1}>
                                    {currentGame.title}
                                </Text>
                            </View>
                        </TouchableWithoutFeedback>
                        {currentGame.locked &&
                            <Text style={{ color: 'gray', fontSize: 20, paddingHorizontal: 10 }}
                                onPress={() => { bottomSheetRef.current?.snapToIndex(snapPoints.length - 1); }}
                            >
                                Locked
                            </Text>
                        }
                        {!currentGame.locked &&
                            <Text style={styles.editButton} onPress={() => navigation.navigate('Settings')}>
                                Edit
                            </Text>
                        }
                    </View>

                    <Animated.View style={[styles.sheetContent, animatedSheetStyle]}>
                        <Rounds navigation={navigation} show={!fullscreen} />
                        <Text style={{ color: 'white' }}>
                            Tap on a column to set the current round.
                        </Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 }}>
                            <TouchableOpacity activeOpacity={.5} onPress={() => navigation.navigate('Share')}>
                                <View style={[styles.shareButton]}>
                                    <Icon name="share-outline" type="ionicon" size={30} color={systemBlue} />
                                    <Text style={{ color: systemBlue, fontSize: 15, paddingTop: 5 }}>Share</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity activeOpacity={.5} onPress={setLock}>
                                <View style={[styles.shareButton]}>
                                    <Icon name={currentGame.locked ? "lock-closed-outline" : "lock-open-outline"}
                                        type="ionicon" size={30}
                                        color={currentGame.locked ? 'red' : 'green'}
                                    />
                                    <Text style={{
                                        color: currentGame.locked ? 'red' : 'green',
                                        fontSize: 15, paddingTop: 5
                                    }}>
                                        {currentGame.locked ? "Unlock" : "Lock"}
                                    </Text>
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
    sheetTitleView: {
        flex: 1,
        paddingHorizontal: 10,
        paddingTop: 0,
    },
    sheetTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    editButton: {
        color: systemBlue,
        fontSize: 20,
        paddingHorizontal: 10,
    },
    sheetContent: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    shareButton: {
        width: 100,
        margin: 5,
        padding: 10,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,.2)',
        borderRadius: 10,
        alignItems: 'center'
    },
});

export default GameBottomSheet;
