import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { Provider } from 'react-redux';

import settingsReducer from '../../redux/SettingsSlice';

import LockedGameHint from './LockedGameHint';
import { LockedHintContextProvider, useLockedHint } from './LockedHintContext';

jest.mock('expo-haptics', () => ({
    notificationAsync: jest.fn(),
    NotificationFeedbackType: { Warning: 'warning' },
}));

jest.mock('react-native-reanimated', () => {
    const { View } = jest.requireActual('react-native');
    return {
        __esModule: true,
        default: { View },
        FadeIn: { duration: jest.fn() },
        FadeOut: { duration: jest.fn() },
    };
});

jest.mock('react-native-elements', () => ({
    Icon: () => null,
}));

const Trigger = () => {
    const { showLockedHint, hideLockedHint } = useLockedHint();
    return (
        <>
            <Pressable testID="show" onPress={showLockedHint}><Text>Show</Text></Pressable>
            <Pressable testID="hide" onPress={hideLockedHint}><Text>Hide</Text></Pressable>
        </>
    );
};

const renderHint = () => render(
    <Provider store={configureStore({ reducer: { settings: settingsReducer } })}>
        <LockedHintContextProvider>
            <Trigger />
            <LockedGameHint top={8} />
        </LockedHintContextProvider>
    </Provider>
);

describe('LockedHintContext', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('shows the hint and hides it after a few seconds', () => {
        const { getByTestId, queryByTestId } = renderHint();
        expect(queryByTestId('locked-game-hint')).toBeNull();

        fireEvent.press(getByTestId('show'));
        expect(getByTestId('locked-game-hint')).toBeTruthy();

        act(() => {
            jest.advanceTimersByTime(2500);
        });
        expect(queryByTestId('locked-game-hint')).toBeNull();
    });

    it('hides the hint right away when asked', () => {
        const { getByTestId, queryByTestId } = renderHint();

        fireEvent.press(getByTestId('show'));
        fireEvent.press(getByTestId('hide'));

        expect(queryByTestId('locked-game-hint')).toBeNull();
    });
});
