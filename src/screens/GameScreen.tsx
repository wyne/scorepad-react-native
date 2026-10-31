import React, { useEffect, useLayoutEffect } from 'react';

import { useHeaderHeight } from '@react-navigation/elements';
import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { useAppSelector } from '../../redux/hooks';
import { selectInteractionType } from '../../redux/selectors';
import ListBoard from '../components/Boards/ListBoard';
import TileBoard from '../components/Boards/TileBoard';
import { useGameOptionsHeaderItems } from '../components/Buttons/GameOptionsButton';
import { InteractionType } from '../components/Interactions/InteractionType';
import LockedGameHint from '../components/LockedGameHint';
import ChooseWinnersSheet from '../components/Sheets/ChooseWinnersSheet';
import GameOverSheet from '../components/Sheets/GameOverSheet';
import GestureInfoSheet from '../components/Sheets/GestureInfoSheet';
import PointValuesSheet from '../components/Sheets/PointValuesSheet';
import { FOLD_GAP, useGameFoldSplit, useVerticalBarLayout } from '../hooks/useExpandedGameLayout';
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

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase>;
}

const BOARD_LAYOUT_TRANSITION = LinearTransition
    .duration(280)
    .easing(Easing.out(Easing.cubic));

const GameScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const keepScreenAwake = useAppSelector(state => state.settings.keepScreenAwake);
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
    const paddingTop = scrollUnderHeader ? 0 : headerHeight;
    const boardStyle = foldSplit === 'columns'
        ? [styles.boardFirstColumn, { width: windowWidth / 2 - FOLD_GAP / 2 }]
        : foldSplit === 'rows'
            ? [styles.boardFirstRow, { height: windowHeight / 2 - FOLD_GAP / 2 - paddingTop }]
            : StyleSheet.absoluteFill;

    if (typeof currentGameId == 'undefined') return null;

    return (
        <View style={{ flex: 1, paddingTop }} testID="game-screen">
            <View style={{ flex: 1 }}>
                <Animated.View layout={BOARD_LAYOUT_TRANSITION} style={boardStyle} testID="game-board-area">
                    {isDial
                        ? <Animated.View key="rows" entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)} style={StyleSheet.absoluteFill}>
                            <ListBoard foldSplit={foldSplit} showHint={showHint} topInset={scrollUnderHeader ? headerHeight : 0} />
                        </Animated.View>
                        : <Animated.View key="flex" entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)} style={StyleSheet.absoluteFill}>
                            <TileBoard foldSplit={foldSplit} showHint={showHint} />
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
    boardFirstColumn: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
    },
    boardFirstRow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
});

export default GameScreen;
