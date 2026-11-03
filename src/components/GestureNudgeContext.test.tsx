import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';
import { Provider } from 'react-redux';

import settingsReducer from '../../redux/SettingsSlice';

import GestureNudge from './GestureNudge';
import { GestureNudgeContextProvider, MAX_NUDGES_PER_SESSION, MISS_WINDOW_MS, useGestureNudge } from './GestureNudgeContext';
import { InteractionType } from './Interactions/InteractionType';

jest.mock('../Analytics', () => ({ logEvent: jest.fn() }));

jest.mock('react-native-reanimated', () => {
    const { View } = jest.requireActual('react-native');
    return {
        __esModule: true,
        default: { View },
        FadeIn: { duration: jest.fn() },
        FadeOut: { duration: jest.fn() },
    };
});

jest.mock('@rneui/base', () => ({
    Icon: () => null,
}));

const Trigger = () => {
    const { reportMiss } = useGestureNudge();
    return (
        <>
            <Pressable testID="miss-swipe" onPress={() => reportMiss(InteractionType.SwipeVertical)}><Text>Swipe</Text></Pressable>
            <Pressable testID="miss-dial" onPress={() => reportMiss(InteractionType.Dial)}><Text>Dial</Text></Pressable>
            <Pressable testID="miss-tap" onPress={() => reportMiss(InteractionType.HalfTap)}><Text>Tap</Text></Pressable>
        </>
    );
};

const renderNudge = () => render(
    <Provider store={configureStore({ reducer: { settings: settingsReducer } })}>
        <GestureNudgeContextProvider>
            <Trigger />
            <GestureNudge top={8} />
        </GestureNudgeContextProvider>
    </Provider>
);

describe('GestureNudge', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('ignores a single miss', () => {
        const { getByTestId, queryByTestId } = renderNudge();
        fireEvent.press(getByTestId('miss-swipe'));
        expect(queryByTestId('gesture-nudge')).toBeNull();
    });

    it('explains the gesture on a second miss in a row', () => {
        const { getByTestId, getByText } = renderNudge();
        fireEvent.press(getByTestId('miss-swipe'));
        fireEvent.press(getByTestId('miss-swipe'));
        expect(getByText('Swipe up or down to change a score.')).toBeTruthy();
    });

    it('uses the dial message for dial misses', () => {
        const { getByTestId, getByText } = renderNudge();
        fireEvent.press(getByTestId('miss-dial'));
        fireEvent.press(getByTestId('miss-dial'));
        expect(getByText('Turn the ring to change the score.')).toBeTruthy();
    });

    it('does not pair misses that are far apart', () => {
        const { getByTestId, queryByTestId } = renderNudge();
        fireEvent.press(getByTestId('miss-swipe'));
        act(() => { jest.advanceTimersByTime(MISS_WINDOW_MS + 1); });
        fireEvent.press(getByTestId('miss-swipe'));
        expect(queryByTestId('gesture-nudge')).toBeNull();
    });

    it('has no nudge for tap misses', () => {
        const { getByTestId, queryByTestId } = renderNudge();
        fireEvent.press(getByTestId('miss-tap'));
        fireEvent.press(getByTestId('miss-tap'));
        expect(queryByTestId('gesture-nudge')).toBeNull();
    });

    it('hides on its own after a moment', () => {
        const { getByTestId, queryByTestId } = renderNudge();
        fireEvent.press(getByTestId('miss-swipe'));
        fireEvent.press(getByTestId('miss-swipe'));
        expect(queryByTestId('gesture-nudge')).toBeTruthy();
        act(() => { jest.advanceTimersByTime(2600); });
        expect(queryByTestId('gesture-nudge')).toBeNull();
    });

    it(`stops after ${MAX_NUDGES_PER_SESSION} nudges`, () => {
        const { getByTestId, queryByTestId } = renderNudge();
        for (let i = 0; i < MAX_NUDGES_PER_SESSION; i++) {
            fireEvent.press(getByTestId('miss-swipe'));
            fireEvent.press(getByTestId('miss-swipe'));
            expect(queryByTestId('gesture-nudge')).toBeTruthy();
            act(() => { jest.advanceTimersByTime(2600); });
        }
        fireEvent.press(getByTestId('miss-swipe'));
        fireEvent.press(getByTestId('miss-swipe'));
        expect(queryByTestId('gesture-nudge')).toBeNull();
    });
});
