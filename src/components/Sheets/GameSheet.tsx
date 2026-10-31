import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetHandle, BottomSheetHandleProps, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@rneui/base';
import { Alert, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, useWindowDimensions } from 'react-native';
import Animated, { Extrapolate, FadeIn, interpolate, ReduceMotion, runOnJS, SlideInDown, SlideInRight, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { asyncRematchGame, selectGameById, updateGame } from '../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { updatePlayer } from '../../../redux/PlayersSlice';
import { selectGameModesVisible } from '../../../redux/selectors';
import { logEvent } from '../../Analytics';
import { FOLD_GAP, useExpandedGameLayout, useExpandedGameSplit, useGameFoldSplit } from '../../hooks/useExpandedGameLayout';
import { useTheme } from '../../theme';
import BigButton from '../BigButtons/BigButton';
import RoundHeaderTitle from '../Headers/RoundHeaderTitle';
import RematchIcon from '../Icons/RematchIcon';
import ScoreLogTable from '../ScoreLogTable';
import { scoringShortSummary } from '../ScoringRow';

import { useChooseWinnersSheetContext } from './ChooseWinnersSheetContext';
import { useGameSheetContext, useGameSheetPendingIndex } from './GameSheetContext';
import SheetBackground from './SheetBackground';

/**
 * Height of the bottom sheet
 */
export const bottomSheetHeight = 80;

const BUTTON_TILE_MAX_WIDTH = 260;
const BUTTON_TILE_MARGIN = 5;

const GameSheet: React.FunctionComponent = () => {
    const theme = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<ParamListBase>>();
    const { width: containerWidth, height: containerHeight } = useWindowDimensions();
    // On the iPhone Duo's inner display the sheet takes the left half; the
    // round picker takes the right half (see GameScreen).
    const expandedLayout = useExpandedGameLayout();
    const { sheetWidth, pickerWidth, pickerRight } = useExpandedGameSplit();
    // On a partially open iPhone Duo the sheet docks open on the half after
    // the fold, with the board on the other half (see GameScreen): the right
    // half in landscape, the bottom half in portrait. It can't be dragged, and
    // in landscape it carries the round picker.
    const foldSplit = useGameFoldSplit();
    const docked = foldSplit != null;

    // Docking slides the sheet in from the fold side as the board fades in on
    // its own half (see GameScreen); undocking fades the collapsed sheet in.
    // Reduce Motion fades in both cases. Nothing animates on the first mount.
    const reduceMotion = useReducedMotion();
    const hasMountedSheetRef = useRef(false);
    useEffect(() => {
        hasMountedSheetRef.current = true;
    }, []);
    const sheetEntering = !hasMountedSheetRef.current
        ? undefined
        : foldSplit == null || reduceMotion
            ? FadeIn.duration(200).reduceMotion(ReduceMotion.Never)
            : foldSplit === 'columns'
                ? SlideInRight.duration(250)
                : SlideInDown.duration(250);
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const game = useAppSelector(state => selectGameById(state, currentGameId || ''));
    const gameTitle = game?.title;
    const gameLocked = game?.locked;
    const showScoringRule = useAppSelector(state => selectGameModesVisible(state, currentGameId));
    const playerIds = game?.playerIds;
    const chooseWinnersSheetRef = useChooseWinnersSheetContext();

    // ref
    const gameSheetRef = useGameSheetContext();
    const pendingIndexRef = useGameSheetPendingIndex();

    // variables
    const snapPoints = useMemo(() => {
        if (foldSplit === 'rows') return [containerHeight / 2 - FOLD_GAP / 2];
        if (foldSplit === 'columns') return ['100%'];
        return [bottomSheetHeight, '60%', '100%'];
    }, [foldSplit, containerHeight]);

    const dispatch = useAppDispatch();

    const insets = useSafeAreaInsets();
    const topInset = insets.top;

    // Stable key for animated children to force remount on each mount
    const mountKey = useRef(Date.now()).current;

    /**
     * Unlock the game and clear winners
     */
    const unlockGame = () => {
        if (currentGameId == undefined) return;

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
        if (currentGameId == undefined) return;

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

    // Asked to open while hidden (fullscreen): mount at that point instead.
    const [initialIndex] = useState(() => pendingIndexRef?.current ?? 0);
    useEffect(() => {
        if (pendingIndexRef) pendingIndexRef.current = null;
    }, [pendingIndexRef]);

    // State variable for the current snap point index
    const [snapPointIndex, setSnapPointIndex] = useState(initialIndex);
    const [shouldRenderContent, setShouldRenderContent] = useState(initialIndex > 0);
    const hasMountedRef = useRef(false);

    useEffect(() => {
        if (hasMountedRef.current) {
            if (snapPointIndex == 0) {
                logEvent('game_sheet_close');
            } else {
                logEvent('game_sheet_snap', {
                    snap_point_index: snapPointIndex,
                });

            }
        } else {
            // Skip the effect on the first render
            hasMountedRef.current = true;
        }
    }, [snapPointIndex]);

    const onAnimate = useCallback((_fromIndex: number, toIndex: number) => {
        if (toIndex > 0) setShouldRenderContent(true);
    }, []);

    /**
     * Function to handle changes in the bottom sheet
     */
    const onSheetChange = useCallback((index: number) => {
        setSnapPointIndex(index);
        if (index === 0) setShouldRenderContent(false);
    }, []);

    /**
     * Function to snap to the next point when the handle is pressed
     */
    const sheetTitlePress = useCallback(() => {
        setSnapPointIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % snapPoints.length;
            gameSheetRef?.current?.snapToIndex(nextIndex);
            return nextIndex;
        });
    }, [gameSheetRef, snapPoints.length]);

    /**
     * Animated position of the bottom sheet
     * Calculated as the difference between the current position and the first snap point
     */
    const animatedPosition = useSharedValue(0);

    /**
     * Animated style for the bottom sheet
     */
    const animatedSheetStyle = useAnimatedStyle(() => {
        if (docked) return { opacity: 1 };

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

    /**
     * Animated snap index of the bottom sheet: 0 collapsed, 1 at 60%, 2 at the
     * next stop up (the content height, from the sheet's dynamic sizing, or 100%).
     */
    const animatedIndex = useSharedValue(0);

    // A manual drag only calls onAnimate on release, so in the expanded layout
    // render the content as soon as the drag starts; otherwise the score table
    // is blank while the sheet grows. (With dynamic sizing on, rendering
    // mid-drag would move the snap points, so the other layouts wait.)
    useAnimatedReaction(
        () => expandedLayout && animatedIndex.value > 0.05,
        (isOpening, wasOpening) => {
            if (isOpening && !wasOpening) runOnJS(setShouldRenderContent)(true);
        },
        [expandedLayout]
    );

    /**
     * Width of the sheet. In the expanded layout the collapsed sheet shares
     * the bottom strip with the round picker, then grows as it is pulled up:
     * two-thirds of the screen at the middle snap point, the full width at the
     * next one. Tied to the sheet's index, so it tracks the drag.
     */
    const animatedWidth = useDerivedValue(() => {
        if (foldSplit === 'columns') return containerWidth / 2 - FOLD_GAP / 2;
        if (!expandedLayout) return containerWidth;

        return interpolate(
            animatedIndex.value,
            [0, 1, 2],
            [sheetWidth, containerWidth * 2 / 3, containerWidth],
            Extrapolate.CLAMP
        );
    });
    const animatedWidthStyle = useAnimatedStyle(() => ({
        width: animatedWidth.value,
        // Past the fold. The library pins the sheet's left edge, so offset it
        // with a margin rather than `left`.
        marginLeft: foldSplit === 'columns' ? containerWidth / 2 + FOLD_GAP / 2 : 0,
    }));

    // Safe area padding, applied only where the sheet actually reaches into the
    // inset: on the iPhone Duo the vertical bar's inset on the right only
    // matters once the sheet is wide enough to extend under it.
    const animatedSafeAreaStyle = useAnimatedStyle(() => {
        // Docked on the right half, the sheet reaches the vertical bar but not
        // the left edge.
        if (foldSplit === 'columns') return { paddingLeft: 0, paddingRight: insets.right };

        return {
            paddingLeft: insets.left,
            paddingRight: Math.max(0, insets.right - (containerWidth - animatedWidth.value)),
        };
    });

    /**
     * Locking the game removes Edit Game and Reset, and the remaining buttons
     * rebalance. This is animated directly (fade, then collapse) rather than
     * with layout transitions, which also fire on every resize and would chase
     * the sheet's width while it is dragged. Everything here is derived from
     * the sheet width and lockProgress on the UI thread, so each frame is laid
     * out once. The removed items unmount once collapsed.
     */
    const lockProgress = useSharedValue(gameLocked ? 1 : 0);
    const [renderUnlockedItems, setRenderUnlockedItems] = useState(!gameLocked);
    useEffect(() => {
        if (!gameLocked) setRenderUnlockedItems(true);
        lockProgress.value = withTiming(gameLocked ? 1 : 0, { duration: 600 }, (finished) => {
            if (finished && gameLocked) runOnJS(setRenderUnlockedItems)(false);
        });
    }, [gameLocked, lockProgress]);

    const editButtonHeight = useSharedValue(0);
    const animatedEditButtonStyle = useAnimatedStyle(() => ({
        opacity: interpolate(lockProgress.value, [0, 0.4], [1, 0], Extrapolate.CLAMP),
        maxHeight: editButtonHeight.value > 0
            ? interpolate(lockProgress.value, [0.4, 1], [editButtonHeight.value, 0], Extrapolate.CLAMP)
            : 9999, // not measured yet: no limit
    }));
    const animatedResetButtonStyle = useAnimatedStyle(() => ({
        opacity: interpolate(lockProgress.value, [0, 0.4], [1, 0], Extrapolate.CLAMP),
        maxWidth: interpolate(lockProgress.value, [0.4, 1], [BUTTON_TILE_MAX_WIDTH, 0], Extrapolate.CLAMP),
        marginHorizontal: interpolate(lockProgress.value, [0.4, 1], [BUTTON_TILE_MARGIN, 0], Extrapolate.CLAMP),
    }));

    /**
     * The round picker beside the collapsed sheet fades out as the sheet
     * grows over it.
     */
    const animatedRoundPickerStyle = useAnimatedStyle(() => ({
        opacity: interpolate(animatedIndex.value, [0, 0.33], [1, 0], Extrapolate.CLAMP),
    }));

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

    const renderHandle = useCallback(
        (props: BottomSheetHandleProps) => (
            <TouchableOpacity activeOpacity={0.7} onPress={sheetTitlePress} testID="game-sheet-handle">
                <View>
                    <BottomSheetHandle {...props} indicatorStyle={{ backgroundColor: theme.sheetHandle }} />
                </View>
            </TouchableOpacity>
        ),
        [sheetTitlePress, theme.sheetHandle]
    );

    if (currentGameId == undefined) return null;

    return (
        <Animated.View
            key={foldSplit ?? 'flat'}
            entering={sheetEntering}
            pointerEvents="box-none"
            style={StyleSheet.absoluteFill}
        >
            {expandedLayout && !docked && (
                <Animated.View
                    style={[
                        styles.bottomStripRoundPicker,
                        { width: pickerWidth, right: pickerRight },
                        animatedRoundPickerStyle,
                    ]}
                    testID="bottom-strip-round-picker"
                >
                    <RoundHeaderTitle />
                </Animated.View>
            )}
            {/* Keyed above: docking and undocking change the snap points, so the
                sheet starts over at its first point rather than carry an index
                over. */}
            <BottomSheet
                ref={gameSheetRef}
                index={docked ? 0 : initialIndex}
                onChange={onSheetChange}
                onAnimate={onAnimate}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                backgroundComponent={SheetBackground}
                handleComponent={docked ? null : renderHandle}
                enableHandlePanningGesture={!docked}
                enableContentPanningGesture={!docked}
                handleIndicatorStyle={{ backgroundColor: theme.sheetHandle }}
                animatedPosition={animatedPosition}
                animatedIndex={animatedIndex}
                // Dynamic sizing adds a snap point at the content height. In the
                // expanded layout the width animation changes that height mid-drag,
                // which moves the snap points under the finger (the sheet snaps back
                // to half width and the backdrop drops out). Use the fixed points.
                enableDynamicSizing={!expandedLayout && !docked}
                enablePanDownToClose={false}
                topInset={foldSplit === 'columns' ? topInset + 8 : topInset}
                // The library appends its own `left: 0, right: 0` after this style, so
                // set the width rather than moving the right edge.
                style={animatedWidthStyle}
                accessible={false}
                accessibilityViewIsModal={false}
            >
                <BottomSheetScrollView overScrollMode="always">
                    <Animated.View style={animatedSafeAreaStyle}>
                        <View style={[styles.sheetHeaderContainer, docked && styles.dockedSheetHeader]}>
                            <TouchableWithoutFeedback onPress={() => sheetTitlePress()}>
                                <View testID="game-title-button" style={[styles.sheetTitleView]}>
                                    <Text style={[styles.sheetTitle, { color: theme.text }]} numberOfLines={1}>
                                        {gameTitle}
                                    </Text>
                                </View>
                            </TouchableWithoutFeedback>

                            {showScoringRule &&
                                <TouchableOpacity
                                    testID="game-sheet-scoring-rule"
                                    accessibilityRole="button"
                                    accessibilityLabel={`Scoring: ${scoringShortSummary(game?.scoring)}`}
                                    disabled={gameLocked}
                                    onPress={() => navigation.navigate('ScoringRules')}
                                    style={styles.scoringRule}
                                >
                                    <Text style={[styles.scoringRuleText, { color: gameLocked ? theme.textTertiary : theme.textSecondary }]}>
                                        {scoringShortSummary(game?.scoring)}
                                    </Text>
                                </TouchableOpacity>
                            }
                            {false &&
                                <Text style={styles.editButton} onPress={() => navigation.navigate('EditGame')}>
                                    Edit
                                </Text>
                            }
                        </View>

                        <Animated.View style={[styles.sheetContent, animatedSheetStyle]}>
                            {foldSplit === 'columns' &&
                                <View style={styles.dockedRoundPicker} testID="docked-round-picker">
                                    <RoundHeaderTitle />
                                </View>
                            }

                            <ScoreLogTable showRounds={docked || shouldRenderContent} />

                            <Text style={{ color: theme.text, marginHorizontal: 5, marginBottom: 10 }}>
                                Tap the player column or total score column to change sorting.
                            </Text>

                            {renderUnlockedItems &&
                                <Animated.View style={[styles.collapsible, animatedEditButtonStyle]}>
                                    <Animated.View
                                        entering={FadeIn.delay(400)}
                                        // Keep its natural height while the wrapper collapses around
                                        // it, and only record that height when fully expanded, so an
                                        // unlock grows it back to the real size.
                                        style={styles.noShrink}
                                        onLayout={(e) => {
                                            if (lockProgress.value === 0) editButtonHeight.value = e.nativeEvent.layout.height;
                                        }}
                                    >
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
                                                navigation.navigate('EditGame', { source: 'edit_game' });
                                            }
                                            }
                                        />
                                    </Animated.View>
                                </Animated.View>
                            }

                            <View key={mountKey + 'a'} style={styles.buttonRow}>
                                <BigButton text="Share"
                                    color={theme.tint}
                                    icon="share-outline"
                                    onPress={() => navigation.navigate('Share')}
                                    style={styles.buttonTile}
                                    testID="share-button"
                                />

                                <BigButton text={gameLocked ? 'Unlock' : 'Choose Winners'}
                                    color={gameLocked ? theme.warning : theme.success}
                                    icon={gameLocked ? 'lock-closed-outline' : 'lock-open-outline'}
                                    onPress={gameLocked ? unlockGame : () => chooseWinnersSheetRef?.current?.present()}
                                    style={styles.buttonTile}
                                    testID={gameLocked ? 'unlock-button' : 'choose-winners-button'}
                                />
                            </View>

                            <View key={mountKey + 'b'} style={styles.buttonRow}>
                                {renderUnlockedItems &&
                                    <BigButton text="Reset"
                                        color={theme.destructive}
                                        icon="backspace-outline"
                                        onPress={resetGameHandler}
                                        style={[styles.buttonTile, styles.collapsible, animatedResetButtonStyle]}
                                    />
                                }

                                <BigButton text="Rematch"
                                    color={theme.warning}
                                    icon={<RematchIcon fill={theme.warning} />}
                                    onPress={rematchGameHandler}
                                    style={styles.buttonTile}
                                />
                            </View>
                        </Animated.View>
                    </Animated.View>
                </BottomSheetScrollView>

            </BottomSheet>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    bottomStripRoundPicker: {
        position: 'absolute',
        bottom: 0,
        height: bottomSheetHeight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Docked, the sheet has no handle above the title.
    dockedSheetHeader: {
        paddingTop: 16,
    },
    dockedRoundPicker: {
        alignItems: 'center',
        paddingBottom: 10,
    },
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
    scoringRule: {
        justifyContent: 'center',
        paddingHorizontal: 10,
        minHeight: 28,
    },
    scoringRuleText: {
        fontSize: 15,
    },
    editButton: {
        fontSize: 20,
        paddingHorizontal: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    // Two tiles share a row and grow with the sheet; a lone tile stays the
    // same size and is centered.
    buttonTile: {
        width: '47%',
        maxWidth: BUTTON_TILE_MAX_WIDTH,
        marginHorizontal: BUTTON_TILE_MARGIN,
    },
    collapsible: {
        overflow: 'hidden',
    },
    noShrink: {
        flexShrink: 0,
    },
    // 15 plus each child's own 5pt margin lines content up with the title
    // at the app's 20pt gutter.
    sheetContent: {
        paddingVertical: 10,
        paddingHorizontal: 15,
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
