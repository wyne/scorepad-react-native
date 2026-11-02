import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, renderHook } from '@testing-library/react-native';
import { Appearance } from 'react-native';
import { Provider } from 'react-redux';

import settingsReducer, { setColorScheme } from '../redux/SettingsSlice';

import { useSyncNativeAppearance } from './theme';

const makeStore = () => configureStore({
    reducer: {
        settings: settingsReducer,
    },
});

describe('useSyncNativeAppearance', () => {
    const setNativeColorScheme = jest.spyOn(Appearance, 'setColorScheme').mockImplementation();

    beforeEach(() => {
        setNativeColorScheme.mockClear();
    });

    afterAll(() => {
        setNativeColorScheme.mockRestore();
    });

    it('lets the native app follow the device for the System preference', () => {
        const store = makeStore();

        renderHook(() => useSyncNativeAppearance(), {
            wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        });

        expect(setNativeColorScheme).toHaveBeenLastCalledWith('auto');
    });

    it('keeps native controls synchronized with explicit app preferences', () => {
        const store = makeStore();

        renderHook(() => useSyncNativeAppearance(), {
            wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
        });

        act(() => {
            store.dispatch(setColorScheme('light'));
        });
        expect(setNativeColorScheme).toHaveBeenLastCalledWith('light');

        act(() => {
            store.dispatch(setColorScheme('dark'));
        });
        expect(setNativeColorScheme).toHaveBeenLastCalledWith('dark');
    });
});
