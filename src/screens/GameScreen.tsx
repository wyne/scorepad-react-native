import React, { useEffect } from 'react';

import { useHeaderHeight } from '@react-navigation/elements';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { View } from 'react-native';

import { useAppSelector } from '../../redux/hooks';
import FlexboxBoard from '../components/Boards/FlexboxBoard';
import RowsBoard from '../components/Boards/RowsBoard';
import { InteractionType } from '../components/Interactions/InteractionType';
import AddendModal from '../components/Sheets/AddendModal';
import GestureInfoModal from '../components/Sheets/GestureInfoModal';
import { selectInteractionType } from '../../redux/selectors';

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
    useKeepScreenAwake(keepScreenAwake);

    if (typeof currentGameId == 'undefined') return null;

    return (
        <View style={{ flex: 1, paddingTop: headerHeight }} testID="game-screen">
            <View style={{ flex: 1 }}>
                {interactionType === InteractionType.RadialGesture
                    ? <RowsBoard />
                    : <FlexboxBoard />
                }

                <AddendModal />
                <GestureInfoModal />
            </View>
        </View>
    );
};


export default ScoreBoardScreen;
