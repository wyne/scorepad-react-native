import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import BottomSheet, { BottomSheetBackdrop, BottomSheetBackdropProps, BottomSheetHandle, BottomSheetHandleProps, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { getDefaultHeaderHeight } from '@react-navigation/elements';
import { ParamListBase, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, useWindowDimensions } from 'react-native';
import Animated, { Extrapolate, FadeIn, FadeOut, interpolate, ReduceMotion, runOnJS, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { asyncRematchGame, selectGameById, updateGame } from '../../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { updatePlayer } from '../../../redux/PlayersSlice';
import { selectGameModesVisible } from '../../../redux/selectors';
import { logEvent } from '../../Analytics';
import { useExpandedGameLayout, useExpandedGameSplit, useFoldSplitBounds, useGameFoldSplit, useVerticalBarLayout } from '../../hooks/useExpandedGameLayout';
import { useTheme } from '../../theme';
import RoundHeaderTitle from '../Headers/RoundHeaderTitle';
import ScoreLogTable from '../ScoreLogTable';
import { scoringShortSummary } from '../ScoringRow';

import { useChooseWinnersSheetContext } from './ChooseWinnersSheetContext';
import GameSheetActions, { GameResultBanner } from './GameSheetActions';
import { useGameSheetContext, useGameSheetPendingIndex } from './GameSheetContext';
import SheetBackground from './SheetBackground';

/**
 * Height of the bottom sheet
 */
export const bottomSheetHeight = 80;

// A fade is gentle enough to keep with Reduce Motion on.
const SHEET_FADE_IN = FadeIn.duration(200).reduceMotion(ReduceMotion.Never);
const SHEET_FADE_OUT = FadeOut.duration(150).reduceMotion(ReduceMotion.Never);

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
    const { sheetStart } = useFoldSplitBounds(foldSplit);
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
        if (foldSplit === 'rows') return [containerHeight - sheetStart];
        if (foldSplit === 'columns') return ['100%'];
        return [bottomSheetHeight, '60%', '100%'];
    }, [foldSplit, containerHeight, sheetStart]);

    const dispatch = useAppDispatch();

    const insets = useSafeAreaInsets();
    const topInset = insets.top;
    // Docked beside the board, the sheet starts just below the header: on the
    // iPhone Duo the header is empty (its items are in the vertical bar), so
    // only the status area; elsewhere below the header's Back button. The
    // sheet sits above the navigator, so it can't measure the header itself.
    const verticalBars = useVerticalBarLayout();
    const dockedTopInset = (verticalBars
        ? topInset
        : getDefaultHeaderHeight({ width: containerWidth, height: containerHeight }, false, topInset)) + 8;


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

    // Docking and undocking rebuild the sheet (it's keyed by the fold split
    // below), and it starts over at its first snap point: collapsed when flat,
    // open when docked. Reset what this component tracks about the old sheet
    // to match, so a title tap cycles from the right place. The reset isn't
    // the user closing the sheet, so it isn't logged.
    const [sheetStartIndex, setSheetStartIndex] = useState(initialIndex);
    const [lastFoldSplit, setLastFoldSplit] = useState(foldSplit);
    const skipSnapLogRef = useRef(false);
    if (lastFoldSplit !== foldSplit) {
        setLastFoldSplit(foldSplit);
        setSheetStartIndex(0);
        if (snapPointIndex !== 0) skipSnapLogRef.current = true;
        setSnapPointIndex(0);
        setShouldRenderContent(false);
    }

    useEffect(() => {
        if (skipSnapLogRef.current) {
            skipSnapLogRef.current = false;
            return;
        }
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
     * Animated snap index of the bottom sheet: 0 collapsed, 1 at 60%, 2 at the
     * next stop up (the content height, from the sheet's dynamic sizing, or 100%).
     */
    const animatedIndex = useSharedValue(0);

    /**
     * Animated style for the bottom sheet
     */
    const animatedSheetStyle = useAnimatedStyle(() => {
        if (docked) return { opacity: 1 };

        // Track the snap index rather than the position: the index starts at
        // collapsed, while a freshly mounted sheet's position reads as fully
        // open until it is laid out, which flashed the buttons on undocking.
        return {
            opacity: interpolate(animatedIndex.value, [0, 0.3], [0, 1], Extrapolate.CLAMP),
        };
    });

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
        // Docked on the right half, stop short of the vertical bar: the sheet
        // sits above the navigator, so it would cover Back and the other bar
        // buttons.
        if (foldSplit === 'columns') return containerWidth - sheetStart - insets.right;
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
        marginLeft: foldSplit === 'columns' ? sheetStart : 0,
    }));

    // Safe area padding, applied only where the sheet actually reaches into the
    // inset: on the iPhone Duo the vertical bar's inset on the right only
    // matters once the sheet is wide enough to extend under it.
    const animatedSafeAreaStyle = useAnimatedStyle(() => {
        // Docked on the right half, the sheet already ends at the vertical bar
        // and starts past the fold, so neither inset applies.
        if (foldSplit === 'columns') return { paddingLeft: 0, paddingRight: 0 };

        return {
            paddingLeft: insets.left,
            paddingRight: Math.max(0, insets.right - (containerWidth - animatedWidth.value)),
        };
    });

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
        // Docking and undocking cross-fade the whole sheet, round picker
        // included, as one layer while the board resizes (see GameScreen).
        // Keyed: the snap points change, so the sheet starts over at its first
        // point rather than carry an index over.
        <Animated.View
            key={foldSplit ?? 'flat'}
            entering={hasMountedRef.current ? SHEET_FADE_IN : undefined}
            exiting={SHEET_FADE_OUT}
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
            <BottomSheet
                ref={gameSheetRef}
                index={docked ? 0 : sheetStartIndex}
                onChange={onSheetChange}
                onAnimate={onAnimate}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                backgroundComponent={SheetBackground}
                handleComponent={docked ? null : renderHandle}
                enableHandlePanningGesture={!docked}
                enableContentPanningGesture={!docked}
                handleIndicatorStyle={{ backgroundColor: theme.sheetHandle }}
                animatedIndex={animatedIndex}
                // Dynamic sizing adds a snap point at the content height. In the
                // expanded layout the width animation changes that height mid-drag,
                // which moves the snap points under the finger (the sheet snaps back
                // to half width and the backdrop drops out). Use the fixed points.
                enableDynamicSizing={!expandedLayout && !docked}
                enablePanDownToClose={false}
                topInset={foldSplit === 'columns' ? dockedTopInset : topInset}
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

                            {showScoringRule && game?.scoring &&
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

                            <GameResultBanner />

                            <ScoreLogTable showRounds={docked || shouldRenderContent} />

                            <Text style={{ color: theme.textSecondary, fontSize: 13, marginHorizontal: 5, marginTop: 4, marginBottom: 10 }}>
                                Tap the player column or total score column to change sorting.
                            </Text>

                            <GameSheetActions
                                locked={gameLocked === true}
                                onShare={() => navigation.navigate('Share')}
                                onChooseWinners={() => chooseWinnersSheetRef?.current?.present()}
                                onUnlock={unlockGame}
                                onRematch={rematchGameHandler}
                                onReset={resetGameHandler}
                                onEditGame={() => {
                                    logEvent('edit_game', {
                                        game_id: currentGameId
                                    });
                                    navigation.navigate('EditGame', { source: 'edit_game' });
                                }}
                            />
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
    // 15 plus each child's own 5pt margin lines content up with the title
    // at the app's 20pt gutter.
    sheetContent: {
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
});

export default GameSheet;
