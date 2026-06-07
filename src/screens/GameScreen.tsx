import React, { useEffect } from 'react';

import { useHeaderHeight } from '@react-navigation/elements';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useAppSelector } from '../../redux/hooks';
import { selectInteractionType } from '../../redux/selectors';
import FlexboxBoard from '../components/Boards/FlexboxBoard';
import RowsBoard from '../components/Boards/RowsBoard';
import { InteractionType } from '../components/Interactions/InteractionType';
import AddendModal from '../components/Sheets/AddendModal';
import ChooseWinnersModal from '../components/Sheets/ChooseWinnersModal';
import GestureInfoModal from '../components/Sheets/GestureInfoModal';
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

const ScoreBoardScreen: React.FunctionComponent = () => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const keepScreenAwake = useAppSelector(state => state.settings.keepScreenAwake);
    const interactionType = useAppSelector(selectInteractionType);
    const headerHeight = useHeaderHeight();
    const showHint = useGestureHint();
    useKeepScreenAwake(keepScreenAwake);

    if (typeof currentGameId == 'undefined') return null;

    return (
        <View style={{ flex: 1, paddingTop: headerHeight }} testID="game-screen">
            <View style={{ flex: 1 }}>
                {interactionType === InteractionType.Dial
                    ? <Animated.View key="rows" entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)} style={StyleSheet.absoluteFill}>
                        <RowsBoard showHint={showHint} />
                    </Animated.View>
                    : <Animated.View key="flex" entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)} style={StyleSheet.absoluteFill}>
                        <FlexboxBoard showHint={showHint} />
                    </Animated.View>
                }

                <AddendModal />
                <ChooseWinnersModal />
                <GestureInfoModal />
            </View>
        </View>
    );
};


export default ScoreBoardScreen;
