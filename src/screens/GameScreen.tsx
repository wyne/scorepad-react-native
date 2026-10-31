import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { useHeaderHeight } from '@react-navigation/elements';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, LayoutAnimationsValues, LinearTransition, useReducedMotion, withTiming } from 'react-native-reanimated';

import { useAppSelector } from '../../redux/hooks';
import { selectInteractionType } from '../../redux/selectors';
import ListBoard from '../components/Boards/ListBoard';
import TileBoard from '../components/Boards/TileBoard';
import { useGameOptionsHeaderItems } from '../components/Buttons/GameOptionsButton';
import { InteractionType } from '../components/Interactions/InteractionType';
import LockedGameHint from '../components/LockedGameHint';
import ChooseWinnersSheet from '../components/Sheets/ChooseWinnersSheet';
import GameOverSheet from '../components/Sheets/GameOverSheet';
import { bottomSheetHeight } from '../components/Sheets/GameSheet';
import GestureInfoSheet from '../components/Sheets/GestureInfoSheet';
import PointValuesSheet from '../components/Sheets/PointValuesSheet';
import { FOLD_GAP, useGameFoldSplit, useRoundPickerInBottomStrip, useVerticalBarLayout } from '../hooks/useExpandedGameLayout';
import { useGestureHint } from '../hooks/useGestureHint';

function useKeepScreenAwake(active: boolean): void {
    useEffect(() => {
        if (active) {
            activateKeepAwakeAsync('game-screen');
        }

        return () => {
            deactivateKeepAwake('game-screen');
        };
    }, [active]);
}

// How long a fold change keeps the board resize animation armed. The layout
// change lands in the same commit; this only has to outlast that commit, so a
// later rotation doesn't animate.
const BOARD_RESIZE_WINDOW_MS = 400;

/**
 * Moves the board from its old frame to its new one as a single unit when the
 * iPhone Duo folds or unfolds. The board is laid out at its new size at once;
 * this starts it stretched over the old frame, anchored at the top left, and
 * eases it into place, so the tiles never animate on their own. With Reduce
 * Motion it fades in instead.
 */
export const boardResizeTransition = (reduceMotion: boolean) => (values: LayoutAnimationsValues) => {
    'worklet';
    const target = {
        originX: values.targetOriginX,
        originY: values.targetOriginY,
        width: values.targetWidth,
        height: values.targetHeight,
    };

    if (reduceMotion || !(values.targetWidth > 0 && values.targetHeight > 0)) {
        return {
            initialValues: { ...target, opacity: 0 },
            animations: { opacity: withTiming(1, { duration: 200 }) },
        };
    }

    const timing = { duration: 280, easing: Easing.out(Easing.cubic) };
    // Scaling is about the center, so shift by half the size change to keep
    // the top left corner fixed.
    return {
        initialValues: {
            ...target,
            transform: [
                { translateX: (values.currentWidth - values.targetWidth) / 2 },
                { translateY: (values.currentHeight - values.targetHeight) / 2 },
                { scaleX: values.currentWidth / values.targetWidth },
                { scaleY: values.currentHeight / values.targetHeight },
            ],
        },
        animations: {
            transform: [
                { translateX: withTiming(0, timing) },
                { translateY: withTiming(0, timing) },
                { scaleX: withTiming(1, timing) },
                { scaleY: withTiming(1, timing) },
            ],
        },
    };
};

/**
 * The dial list resizes its frame instead: its rows keep their height and
 * just narrow or widen, so a short list doesn't move at all when only the
 * height changes, where scaling would stretch it.
 */
const listBoardResize = LinearTransition.duration(280).easing(Easing.out(Easing.cubic));

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase>;
}

const GameScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const keepScreenAwake = useAppSelector(state => state.settings.keepScreenAwake);
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const interactionType = useAppSelector(state => selectInteractionType(state, currentGameId));
    const headerHeight = useHeaderHeight();
    const showHint = useGestureHint();
    const isDial = interactionType === InteractionType.Dial;
    // With vertical bars (iPhone Duo) the header has no background (see
    // Navigation): let the dial list scroll up under it, and under the round
    // picker when that is still in the header, instead of clipping at its
    // edge. The tiles don't scroll, so they stay below it.
    const scrollUnderHeader = useVerticalBarLayout() && isDial;
    useKeepScreenAwake(keepScreenAwake);

    // On iOS the options menu is a native bar item so iPhone Duo can move it
    // into the vertical bar. Android keeps the React `headerRight`.
    const headerRightItems = useGameOptionsHeaderItems();
    useLayoutEffect(() => {
        if (Platform.OS !== 'ios') return;
        navigation.setOptions({ unstable_headerRightItems: () => headerRightItems });
    }, [navigation, headerRightItems]);

    // On a partially open iPhone Duo the board keeps to the half before the
    // fold; the game sheet docks on the other half (see GameSheet).
    const foldSplit = useGameFoldSplit();
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    // On the iPhone Duo's inner display in landscape the round picker moves out
    // of the header (see GameSheet), which leaves it empty. The tiles take
    // that band, so their top margin matches the small one at the bottom.
    const headerEmpty = useRoundPickerInBottomStrip();
    const paddingTop = scrollUnderHeader || (headerEmpty && !isDial) ? 0 : headerHeight;
    // Room for the collapsed game sheet below the tiles (the dial list scrolls
    // under it instead). It's part of the board's frame rather than padding
    // inside the board, so folding and unfolding animate it with the board.
    const boardBottomInset = isDial || foldSplit ? 0 : fullscreen ? 20 : bottomSheetHeight + 2;
    // Give the board and its tiles the same geometry in this render. Measuring
    // the resized native board first exposes an old grid inside the new bounds.
    const boardSize = useMemo(() => ({
        width: Math.max(0, foldSplit === 'columns' ? windowWidth / 2 - FOLD_GAP / 2 : windowWidth),
        height: Math.max(0, (foldSplit === 'rows' ? windowHeight / 2 - FOLD_GAP / 2 : windowHeight) - paddingTop - boardBottomInset),
    }), [foldSplit, windowWidth, windowHeight, paddingTop, boardBottomInset]);
    const boardOrigin = useMemo(() => ({ x: 0, y: paddingTop }), [paddingTop]);

    // Animate the board's resize only when folding or unfolding changes it,
    // not when the window rotates or the header changes height.
    const reduceMotion = useReducedMotion();
    const boardResize = useMemo(() => boardResizeTransition(reduceMotion), [reduceMotion]);
    const lastFoldSplitRef = useRef(foldSplit);
    const animateBoardUntilRef = useRef(0);
    if (lastFoldSplitRef.current !== foldSplit) {
        // Columns to rows is a rotation while folded: leave that to the system.
        if ((lastFoldSplitRef.current == null) !== (foldSplit == null)) {
            animateBoardUntilRef.current = Date.now() + BOARD_RESIZE_WINDOW_MS;
        }
        lastFoldSplitRef.current = foldSplit;
    }
    const animateBoardResize = Date.now() < animateBoardUntilRef.current;

    if (typeof currentGameId == 'undefined') return null;

    return (
        <View style={{ flex: 1, paddingTop }} testID="game-screen">
            <View style={{ flex: 1 }}>
                <Animated.View
                    layout={animateBoardResize ? (isDial ? listBoardResize : boardResize) : undefined}
                    style={[styles.boardArea, boardSize]}
                    testID="game-board-area"
                >
                    {isDial
                        ? <Animated.View key="rows" entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)} style={StyleSheet.absoluteFill}>
                            <ListBoard foldSplit={foldSplit} showHint={showHint} topInset={scrollUnderHeader ? headerHeight : 0} />
                        </Animated.View>
                        : <Animated.View key="flex" entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)} style={StyleSheet.absoluteFill}>
                            <TileBoard boardOrigin={boardOrigin} boardSize={boardSize} foldSplit={foldSplit} showHint={showHint} />
                        </Animated.View>
                    }

                    <LockedGameHint top={(scrollUnderHeader ? headerHeight : 0) + 8} />
                </Animated.View>

                <PointValuesSheet />
                <ChooseWinnersSheet />
                <GameOverSheet />
                <GestureInfoSheet />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    boardArea: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
});

export default GameScreen;
