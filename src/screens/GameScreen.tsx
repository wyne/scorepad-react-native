import React, { useCallback, useEffect, useRef, useState } from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { useAppSelector } from '../../redux/hooks';
import FlexboxBoard from '../components/Boards/FlexboxBoard';
import AddendModal from '../components/Sheets/AddendModal';
import GameSheet from '../components/Sheets/GameSheet';

function useKeepScreenAwake(durationMinutes: number): () => void {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTimer = useCallback(() => {
        if (timerRef.current != null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        clearTimer();
        timerRef.current = setTimeout(() => {
            deactivateKeepAwake('game-screen');
        }, durationMinutes * 60 * 1000);
    }, [durationMinutes, clearTimer]);

    useEffect(() => {
        if (durationMinutes > 0) {
            activateKeepAwakeAsync('game-screen');
            startTimer();
        } else {
            clearTimer();
            deactivateKeepAwake('game-screen');
        }

        return () => {
            clearTimer();
            deactivateKeepAwake('game-screen');
        };
    }, [durationMinutes, startTimer, clearTimer]);

    const resetTimer = useCallback(() => {
        if (durationMinutes > 0) {
            startTimer();
        }
    }, [durationMinutes, startTimer]);

    return resetTimer;
}

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ScoreBoardScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    if (typeof currentGameId == 'undefined') return null;

    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const keepScreenAwakeDuration = useAppSelector(state => state.settings.keepScreenAwakeDuration);
    const resetKeepAwakeTimer = useKeepScreenAwake(keepScreenAwakeDuration);

    const [windowHeight, setWindowHeight] = useState<number>(0);

    const onLayout = useCallback((event: LayoutChangeEvent) => {
        const { height } = event.nativeEvent.layout;
        setWindowHeight(height);
    }, []);

    return (
        <View style={{ flex: 1 }}
            onTouchStart={resetKeepAwakeTimer}>
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
