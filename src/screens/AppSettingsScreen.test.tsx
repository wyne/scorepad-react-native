import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
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
