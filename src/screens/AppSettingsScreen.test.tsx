import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Provider } from 'react-redux';

import settingsReducer, { initialState as initialSettings } from '../../redux/SettingsSlice';

import AppSettingsScreen from './AppSettingsScreen';

jest.mock('../Analytics', () => ({
    logEvent: jest.fn(),
}));

jest.mock('../components/AppInfo/RotatingIcon', () => () => null);

jest.mock('expo-application', () => ({
    nativeApplicationVersion: '1.0.0',
    nativeBuildVersion: '1',
}));

let mockSafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => mockSafeAreaInsets,
}));

const navigation = { setOptions: jest.fn(), goBack: jest.fn(), navigate: jest.fn() };

const renderScreen = (devMenuEnabled: boolean) => {
    const store = configureStore({
        reducer: { settings: settingsReducer },
        preloadedState: { settings: { ...initialSettings, devMenuEnabled } },
    });
    const screen = render(
        <Provider store={store}>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <AppSettingsScreen navigation={navigation as any} />
        </Provider>
    );
    return { store, screen };
};

describe('AppSettingsScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };
    });

    it('keeps sheet content inside horizontal safe areas', () => {
        mockSafeAreaInsets = { top: 0, bottom: 0, left: 12, right: 96 };
        const { screen } = renderScreen(false);

        expect(StyleSheet.flatten(screen.getByTestId('settings-scroll-view').props.contentContainerStyle)).toEqual(
            expect.objectContaining({ paddingLeft: 12, paddingRight: 96 })
        );
    });

    it('sets the player number style new games start with', () => {
        const { store, screen } = renderScreen(false);

        fireEvent.press(screen.getByTestId('player-numbers-big'));

        expect(store.getState().settings.playerNumbers).toBe('big');
    });

    it('shows the Game Modes switch without the developer menu', () => {
        const { store, screen } = renderScreen(false);

        expect(screen.queryByText('Load Sample Data')).toBeNull();
        const toggle = screen.getByTestId('game-modes-switch');
        fireEvent(toggle, 'valueChange', true);

        expect(store.getState().settings.gameModesEnabled).toBe(true);
    });

    it('keeps the same switch instance when a setting changes', () => {
        const { screen } = renderScreen(false);
        const before = screen.getByTestId('game-modes-switch');

        fireEvent(before, 'valueChange', true);

        // Rows used to remount on every change, which made other switches
        // appear to flip on iOS.
        expect(screen.getByTestId('game-modes-switch')).toBe(before);
    });
});
