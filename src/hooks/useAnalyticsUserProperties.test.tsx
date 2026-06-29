import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import settingsReducer, { initialState as settingsInitialState, setColorScheme } from '../../redux/SettingsSlice';
import { setUserProperty } from '../Analytics';

import { useAnalyticsUserProperties } from './useAnalyticsUserProperties';

jest.mock('../Analytics', () => ({ setUserProperty: jest.fn(), logEvent: jest.fn() }));

const Harness = () => {
    useAnalyticsUserProperties();
    return null;
};

const makeStore = (overrides: Partial<typeof settingsInitialState> = {}) =>
    configureStore({
        reducer: { settings: settingsReducer },
        preloadedState: { settings: { ...settingsInitialState, ...overrides } },
    });

describe('useAnalyticsUserProperties', () => {
    beforeEach(() => jest.clearAllMocks());

    it('sets every user property from settings on mount', () => {
        const mockSet = jest.mocked(setUserProperty);
        const store = makeStore({
            keepScreenAwake: true,
            showPointParticles: false,
            showPlayerIndex: true,
            colorScheme: 'dark',
        });

        render(<Provider store={store}><Harness /></Provider>);

        expect(mockSet).toHaveBeenCalledWith('keep_screen_awake', 'true');
        expect(mockSet).toHaveBeenCalledWith('point_particles', 'false');
        expect(mockSet).toHaveBeenCalledWith('player_index', 'true');
        expect(mockSet).toHaveBeenCalledWith('color_scheme', 'dark');
    });

    it('updates a user property when its setting changes', () => {
        const mockSet = jest.mocked(setUserProperty);
        const store = makeStore({ colorScheme: 'system' });

        render(<Provider store={store}><Harness /></Provider>);
        expect(mockSet).toHaveBeenCalledWith('color_scheme', 'system');

        mockSet.mockClear();
        act(() => { store.dispatch(setColorScheme('light')); });

        expect(mockSet).toHaveBeenCalledWith('color_scheme', 'light');
    });
});
