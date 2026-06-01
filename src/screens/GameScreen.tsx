import React, { useEffect } from 'react';

import { useHeaderHeight } from '@react-navigation/elements';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { View } from 'react-native';

import { useAppSelector } from '../../redux/hooks';
import FlexboxBoard from '../components/Boards/FlexboxBoard';
import AddendModal from '../components/Sheets/AddendModal';
import ChooseWinnersModal from '../components/Sheets/ChooseWinnersModal';
import GestureInfoModal from '../components/Sheets/GestureInfoModal';

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
    const headerHeight = useHeaderHeight();
    useKeepScreenAwake(keepScreenAwake);

    if (typeof currentGameId == 'undefined') return null;

    return (
        <View style={{ flex: 1, paddingTop: headerHeight }} testID="game-screen">
            <View style={{ flex: 1 }}>
                <FlexboxBoard />

                <AddendModal />
                <ChooseWinnersModal />
                <GestureInfoModal />
            </View>
        </View>
    );
};


export default ScoreBoardScreen;
