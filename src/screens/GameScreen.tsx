import React, { useCallback, useEffect, useState } from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { useAppSelector } from '../../redux/hooks';
import FlexboxBoard from '../components/Boards/FlexboxBoard';
import AddendModal from '../components/Sheets/AddendModal';
import GameSheet from '../components/Sheets/GameSheet';

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
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ScoreBoardScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const keepScreenAwake = useAppSelector(state => state.settings.keepScreenAwake);
    useKeepScreenAwake(keepScreenAwake);
    const [windowHeight, setWindowHeight] = useState<number>(0);

    if (typeof currentGameId == 'undefined') return null;

    const onLayout = useCallback((event: LayoutChangeEvent) => {
        const { height } = event.nativeEvent.layout;
        setWindowHeight(height);
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <View style={[StyleSheet.absoluteFillObject]} onLayout={onLayout}>

                <FlexboxBoard />

                {!fullscreen &&
                    <GameSheet navigation={navigation} containerHeight={windowHeight} />
                }
                <AddendModal />
            </View>
        </View>
    );
};


export default ScoreBoardScreen;
