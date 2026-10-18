import React from 'react';

import { act, render } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StyleSheet } from 'react-native';
import { withDelay, withTiming } from 'react-native-reanimated';

import { SplashOverlay } from './SplashOverlay';

jest.mock('expo-image', () => ({
    Image: () => null,
}));

jest.mock('expo-splash-screen', () => ({
    hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-reanimated', () => {
    const { View } = jest.requireActual('react-native');

    return {
        __esModule: true,
        default: { View },
        Easing: {
            cubic: 'cubic',
            in: jest.fn(value => value),
            out: jest.fn(value => value),
            quad: 'quad',
        },
        runOnJS: jest.fn(callback => callback),
        useAnimatedStyle: jest.fn(callback => callback()),
        useSharedValue: jest.fn(value => ({ value })),
        withDelay: jest.fn((_delay, animation) => animation),
        withSequence: jest.fn((...animations) => animations.at(-1)),
        withTiming: jest.fn((value, _config, callback) => {
            callback?.(true);
            return value;
        }),
    };
});

describe('SplashOverlay', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('keeps the overlay visible until persisted state is ready', () => {
        const onDone = jest.fn();
        const view = render(
            <SplashOverlay backgroundColor="#000000" onDone={onDone} ready={false} />
        );

        expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
        expect(withDelay).not.toHaveBeenCalled();
        expect(withTiming).not.toHaveBeenCalled();
        expect(onDone).not.toHaveBeenCalled();

        act(() => {
            view.rerender(
                <SplashOverlay backgroundColor="#000000" onDone={onDone} ready />
            );
        });

        expect(withDelay).toHaveBeenCalled();
        expect(withTiming).toHaveBeenCalled();
        expect(onDone).toHaveBeenCalledTimes(1);
    });

    it('uses the persisted app theme color', () => {
        const { getByTestId } = render(
            <SplashOverlay backgroundColor="#123456" onDone={jest.fn()} ready={false} />
        );

        expect(StyleSheet.flatten(getByTestId('splash-overlay').props.style)).toMatchObject({
            backgroundColor: '#123456',
        });
    });
});
