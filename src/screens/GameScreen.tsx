import React, { useEffect } from 'react';

import { useHeaderHeight } from '@react-navigation/elements';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useAppSelector } from '../../redux/hooks';
import { selectInteractionType } from '../../redux/selectors';
import ListBoard from '../components/Boards/ListBoard';
import TileBoard from '../components/Boards/TileBoard';
import { InteractionType } from '../components/Interactions/InteractionType';
import ChooseWinnersSheet from '../components/Sheets/ChooseWinnersSheet';
import GestureInfoSheet from '../components/Sheets/GestureInfoSheet';
import PointValuesSheet from '../components/Sheets/PointValuesSheet';
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

const GameScreen: React.FunctionComponent = () => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const keepScreenAwake = useAppSelector(state => state.settings.keepScreenAwake);
    const interactionType = useAppSelector(state => selectInteractionType(state, currentGameId));
    const headerHeight = useHeaderHeight();
    const showHint = useGestureHint();
    useKeepScreenAwake(keepScreenAwake);

    if (typeof currentGameId == 'undefined') return null;

    return (
        <View style={{ flex: 1, paddingTop: headerHeight }} testID="game-screen">
            <View style={{ flex: 1 }}>
                {interactionType === InteractionType.Dial
                    ? (
                        <Animated.View key="rows" entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)}
                            style={StyleSheet.absoluteFill} testID="game-board-container">
                            <ListBoard showHint={showHint} />
                        </Animated.View>
                    )
                    : (
                        <Animated.View key="flex" entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)}
                            style={StyleSheet.absoluteFill} testID="game-board-container">
                            <TileBoard showHint={showHint} />
                        </Animated.View>
                    )
                }

                <PointValuesSheet />
                <ChooseWinnersSheet />
                <GestureInfoSheet />
            </View>
        </View>
    );
};


export default GameScreen;
