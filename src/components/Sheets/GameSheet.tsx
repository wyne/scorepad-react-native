import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Platform, StyleSheet, Text, TouchableWithoutFeedback, View, useWindowDimensions } from 'react-native';
import { Button } from 'react-native-elements';
import Animated, { Extrapolate, FadeIn, interpolate, Layout, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { asyncRematchGame, selectGameById, updateGame } from '../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { updatePlayer } from '../../../redux/PlayersSlice';
import { logEvent } from '../../Analytics';
import { useTheme } from '../../theme';
import BigButton from '../BigButtons/BigButton';
import RematchIcon from '../Icons/RematchIcon';
import Rounds from '../Rounds';

import { useChooseWinnersModalContext } from './ChooseWinnersModalContext';
import { useGameSheetContext } from './GameSheetContext';

/**
 * Height of the bottom sheet
 */
export const bottomSheetHeight = 80;

const GameSheet: React.FunctionComponent = () => {
    const theme = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
    const { height: containerHeight } = useWindowDimensions();
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const gameTitle = useAppSelector(state => selectGameById(state, currentGameId || '')?.title);
    const gameLocked = useAppSelector(state => selectGameById(state, currentGameId || '')?.locked);
    const playerIds = useAppSelector(state => selectGameById(state, currentGameId || '')?.playerIds);
    const chooseWinnersModalRef = useChooseWinnersModalContext();

    if (currentGameId == undefined) return null;

    // ref
    const gameSheetRef = useGameSheetContext();

    // variables
    const snapPoints = useMemo(() => [bottomSheetHeight, '60%', '100%'], []);

    const dispatch = useAppDispatch();

    const insets = useSafeAreaInsets();
    const topInset = insets.top + 50;

    // Stable key for animated children to force remount on each mount
    const mountKey = useRef(Date.now()).current;

    /**
     * Unlock the game and clear winners
     */
    const unlockGame = () => {
        dispatch(
            updateGame({
                id: currentGameId,
                changes: {
                    locked: false,
                    winnerIds: [],
                }
            })
        );
        logEvent('lock_game', {
            game_id: currentGameId,
            locked: false,
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
            backgroundStyle={{ backgroundColor: theme.sheetBackground }}
            handleIndicatorStyle={{ backgroundColor: theme.sheetHandle }}
            animatedPosition={animatedPosition}
            enablePanDownToClose={false}
            topInset={topInset}
            style={theme.background === '#000000' ? undefined : styles.sheetShadow}
            accessible={false}
            accessibilityViewIsModal={false}
        >
            <BottomSheetScrollView>
                <SafeAreaView edges={['right', 'left']}>
                    <View style={styles.sheetHeaderContainer}>
                        <TouchableWithoutFeedback onPress={() => sheetTitlePress()}>
                            <View style={[styles.sheetTitleView]}>
                                <Text style={[styles.sheetTitle, { color: theme.text }]} numberOfLines={1}>
                                    {gameTitle}
                                </Text>
                            </View>
                        </TouchableWithoutFeedback>

                        {gameLocked &&
                            <Text style={{ color: theme.textTertiary, fontSize: 20, paddingHorizontal: 10 }}
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
                        <Rounds navigation={navigation} />

                        <Text style={{ color: theme.text, margin: 10, marginTop: 0 }}>
                            Tap the player column or total score column to change sorting.
                        </Text>

                        <Animated.View layout={Layout.delay(200)}>

                            {!gameLocked &&
                                <Animated.View entering={FadeIn.delay(400)}>
                                    <Button title="Edit Game and Players"
                                        type="clear"
                                        testID="edit-game-and-players"
                                        accessibilityLabel="Edit Game and Players"
                                        titleStyle={{ color: theme.tint }}
                                        style={{
                                            margin: 5, marginTop: 15,
                                            backgroundColor: theme.background === '#000000' ? 'rgba(0,0,0,.2)' : '#FFFFFF', borderRadius: 10
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

                        <Animated.View key={mountKey + 'a'} layout={Layout.delay(200)} style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 }}>
                            {Platform.OS === 'ios' &&
                                <BigButton text="Share"
                                    color={theme.tint}
                                    icon="share-outline"
                                    onPress={() => navigation.navigate('Share')}
                                />
                            }

                            <BigButton text={gameLocked ? 'Unlock' : 'Choose Winners'}
                                color={gameLocked ? theme.warning : theme.success}
                                icon={gameLocked ? 'lock-closed-outline' : 'lock-open-outline'}
                                onPress={gameLocked ? unlockGame : () => chooseWinnersModalRef?.current?.present()}
                            />

                        </Animated.View>

                        <Animated.View key={mountKey + 'b'} layout={Layout.delay(200)} style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 }}>
                            {!gameLocked &&
                                <Animated.View layout={Layout.delay(200)} style={{ justifyContent: 'center', alignItems: 'center' }}>
                                    <BigButton text="Reset"
                                        color={theme.destructive}
                                        icon="backspace-outline"
                                        onPress={resetGameHandler}
                                    />
                                </Animated.View>
                            }

                            <Animated.View layout={Layout.delay(200)} style={{ justifyContent: 'center', alignItems: 'center' }}>
                                <BigButton text="Rematch"
                                    color={theme.warning}
                                    icon={<RematchIcon fill={theme.warning} />}
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
        fontSize: 20,
        fontWeight: 'bold',
    },
    editButton: {
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
    sheetShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.12,
        shadowRadius: 5,
        elevation: 8,
    },
});

export default GameSheet;
