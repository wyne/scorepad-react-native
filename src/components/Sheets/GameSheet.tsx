import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ParamListBase, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Platform, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { Button } from 'react-native-elements';
import Animated, { Extrapolate, FadeIn, interpolate, Layout, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { asyncRematchGame, selectGameById, updateGame } from '../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { updatePlayer } from '../../../redux/PlayersSlice';
import { logEvent } from '../../Analytics';
import { systemBlue } from '../../constants';
import BigButton from '../BigButtons/BigButton';
import RematchIcon from '../Icons/RematchIcon';
import Rounds from '../Rounds';

import { useGameSheetContext } from './GameSheetContext';

/**
 * Height of the bottom sheet
 */
export const bottomSheetHeight = 80;

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
    containerHeight: number;
}

const GameSheet: React.FunctionComponent<Props> = ({ navigation, containerHeight }) => {
    const isFocused = useIsFocused();

    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const gameTitle = useAppSelector(state => selectGameById(state, currentGameId || '')?.title);
    const gameLocked = useAppSelector(state => selectGameById(state, currentGameId || '')?.locked);
    const playerIds = useAppSelector(state => selectGameById(state, currentGameId || '')?.playerIds);

    if (currentGameId == undefined) return null;

    // ref
    const gameSheetRef = useGameSheetContext();

    // variables
    const snapPoints = useMemo(() => [bottomSheetHeight, '60%', '100%'], []);

    const dispatch = useAppDispatch();

    /**
     * Lock the game
     */
    const setLock = () => {
        dispatch(
            updateGame({
                id: currentGameId,
                changes: {
                    locked: !gameLocked,
                }
            })
        );
        logEvent('lock_game', {
            game_id: currentGameId,
            locked: !gameLocked
        });
    };

    /**
     * Reset the game, but keep the players
     */
    const resetGameHandler = () => {
        Alert.alert(
            'Reset Game',
            'Warning: This will reset all scores and rounds for this game. Are you sure you want to reset?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Reset',
                    onPress: () => {
                        if (currentGameId == undefined) return;
                        if (playerIds == undefined) return;

                        playerIds.forEach((playerId) => {
                            dispatch(updatePlayer({
                                id: playerId,
                                changes: {
                                    scores: [0],
                                }
                            }
                            ));
                        });
                        dispatch(updateGame({
                            id: currentGameId,
                            changes: {
                                roundCurrent: 0,
                                roundTotal: 1,
                            }
                        }));
                        navigation.navigate('Game');

                        logEvent('reset_game', { game_id: currentGameId });
                    }
                }
            ]
        );
    };

    /**
     * Rematch - start new game with same players
     */
    const rematchGameHandler = async () => {
        Alert.alert(
            'Rematch',
            'This will create a new game with the same players and empty scores.',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Rematch',
                    onPress: () => {
                        dispatch(
                            asyncRematchGame({ gameId: currentGameId })
                        ).then(() => {
                            setTimeout(() => {
                                navigation.navigate('Game');
                            }, 500);
                        });
                    }
                }
            ]
        );
    };

    // State variable for the current snap point index
    const [snapPointIndex, setSnapPointIndex] = useState(0);
    const hasMountedRef = useRef(false);

    useEffect(() => {
        if (hasMountedRef.current) {
            if (snapPointIndex == 0) {
                logEvent('game_sheet_close');
            } else {
                logEvent('game_sheet_snap', {
                    snapPointIndex: snapPointIndex,
                });

            }
        } else {
            // Skip the effect on the first render
            hasMountedRef.current = true;
        }
    }, [snapPointIndex]);

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
            gameSheetRef?.current?.snapToIndex(nextIndex);
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
            ref={gameSheetRef}
            index={0}
            onChange={onSheetChange}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: 'rgb(30,40,50)' }}
            handleIndicatorStyle={{ backgroundColor: 'white' }}
            animatedPosition={animatedPosition}
            enablePanDownToClose={false}
        >
            <BottomSheetScrollView>
                <SafeAreaView edges={['right', 'left']}>
                    <View style={styles.sheetHeaderContainer}>
                        <TouchableWithoutFeedback onPress={() => sheetTitlePress()}>
                            <View style={[styles.sheetTitleView]}>
                                <Text style={[styles.sheetTitle]} numberOfLines={1}>
                                    {gameTitle}
                                </Text>
                            </View>
                        </TouchableWithoutFeedback>

                        {gameLocked &&
                            <Text style={{ color: 'gray', fontSize: 20, paddingHorizontal: 10 }}
                                onPress={() => { gameSheetRef?.current?.snapToIndex(snapPoints.length - 1); }}
                            >
                                Locked
                            </Text>
                        }
                        {false &&
                            <Text style={styles.editButton} onPress={() => navigation.navigate('Settings')}>
                                Edit
                            </Text>
                        }
                    </View>

                    <Animated.View style={[styles.sheetContent, animatedSheetStyle]}>
                        <Rounds navigation={navigation} show={!fullscreen} />

                        <Text style={{ color: 'white', margin: 10, marginTop: 0 }}>
                            Tap the player column or total score column to change sorting.
                        </Text>

                        <Animated.View layout={Layout.delay(200)}>

                            {!gameLocked &&
                                <Animated.View entering={FadeIn.delay(400)}>
                                    <Button title="Edit Game and Players"
                                        type="clear"
                                        style={{
                                            margin: 5, marginTop: 15,
                                            backgroundColor: 'rgba(0,0,0,.2)', borderRadius: 10
                                        }}
                                        onPress={() => {

                                            logEvent('edit_game', {
                                                game_id: currentGameId
                                            });
                                            navigation.navigate('Settings', { source: 'edit_game' });
                                        }
                                        }
                                    />
                                </Animated.View>
                            }
                        </Animated.View>

                        {/*
                            isFocused + '' is a workaround for broken animations when navigating back to the game screen
                            https://github.com/software-mansion/react-native-reanimated/issues/4816
                            https://github.com/software-mansion/react-native-reanimated/issues/4822
                        */}
                        <Animated.View key={isFocused + 'a'} layout={Layout.delay(200)} style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 }}>
                            {Platform.OS === 'ios' &&
                                <BigButton text="Share"
                                    color={systemBlue}
                                    icon="share-outline"
                                    onPress={() => navigation.navigate('Share')}
                                />
                            }

                            <BigButton text={gameLocked ? 'Unlock' : 'Lock'}
                                color={gameLocked ? 'orange' : 'green'}
                                icon={gameLocked ? 'lock-closed-outline' : 'lock-open-outline'}
                                onPress={setLock}
                            />

                        </Animated.View>

                        <Animated.View key={isFocused + 'b'} layout={Layout.delay(200)} style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 }}>
                            {!gameLocked &&
                                <Animated.View layout={Layout.delay(200)} style={{ justifyContent: 'center', alignItems: 'center' }}>
                                    <BigButton text="Reset"
                                        color='red'
                                        icon="backspace-outline"
                                        onPress={resetGameHandler}
                                    />
                                </Animated.View>
                            }

                            <Animated.View layout={Layout.delay(200)} style={{ justifyContent: 'center', alignItems: 'center' }}>
                                <BigButton text="Rematch"
                                    color='yellow'
                                    icon={<RematchIcon fill="yellow" />}
                                    onPress={rematchGameHandler}
                                />
                            </Animated.View>

                        </Animated.View>
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

export default GameSheet;
