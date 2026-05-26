import React, { useCallback, useEffect, useRef, useState } from 'react';

import { ParamListBase } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { useAppSelector } from '../../redux/hooks';
import FlexboxBoard from '../components/Boards/FlexboxBoard';
import AddendModal from '../components/Sheets/AddendModal';
import GameSheet from '../components/Sheets/GameSheet';

const devLog = (message: string, ...args: unknown[]) => {
    if (__DEV__) {
        console.log(`[KeepAwake] ${message}`, ...args);
    }
};

function useKeepScreenAwake(durationMinutes: number): () => void {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const activeRef = useRef(false);

    useEffect(() => {
        if (durationMinutes <= 0) {
            devLog('Off, not activating');
            return;
        }

        devLog(`Activating for ${durationMinutes} min`);
        activeRef.current = true;
        activateKeepAwakeAsync('game-screen');
        timerRef.current = setTimeout(() => {
            devLog('Timer expired, deactivating');
            deactivateKeepAwake('game-screen');
            activeRef.current = false;
        }, durationMinutes * 60 * 1000);

        return () => {
            if (timerRef.current != null) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            if (activeRef.current) {
                devLog('Cleanup: deactivating');
                deactivateKeepAwake('game-screen');
                activeRef.current = false;
            } else {
                devLog('Cleanup: already inactive, skipping');
            }
        };
    }, [durationMinutes]);

    const resetTimer = useCallback(() => {
        if (durationMinutes <= 0) return;

        devLog('Touch reset: re-activating');
        if (timerRef.current != null) {
            clearTimeout(timerRef.current);
        }
        activeRef.current = true;
        activateKeepAwakeAsync('game-screen');
        timerRef.current = setTimeout(() => {
            devLog('Timer expired (after reset), deactivating');
            deactivateKeepAwake('game-screen');
            activeRef.current = false;
        }, durationMinutes * 60 * 1000);
    }, [durationMinutes]);

    return resetTimer;
}

interface Props {
    navigation: NativeStackNavigationProp<ParamListBase, string, undefined>;
}

const ScoreBoardScreen: React.FunctionComponent<Props> = ({ navigation }) => {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const fullscreen = useAppSelector(state => state.settings.home_fullscreen);
    const keepScreenAwakeDuration = useAppSelector(state => state.settings.keepScreenAwakeDuration);
    const resetKeepAwakeTimer = useKeepScreenAwake(keepScreenAwakeDuration);
    const [windowHeight, setWindowHeight] = useState<number>(0);

    if (typeof currentGameId == 'undefined') return null;

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
