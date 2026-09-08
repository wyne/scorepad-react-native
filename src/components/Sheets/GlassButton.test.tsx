import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import settingsReducer, { initialState as initialSettingsState } from '../../../redux/SettingsSlice';

import GlassButton from './GlassButton';

jest.mock('react-native-elements', () => ({
    Icon: () => null,
}));

// Read through a getter: the component reads LIQUID_GLASS at render time, so
// each test can pick the material without reloading the module graph.
let mockLiquidGlass = false;

jest.mock('../../platform', () => ({
    get LIQUID_GLASS() {
        return mockLiquidGlass;
    },
}));

const renderButton = (onPress = jest.fn()) => render(
    <Provider store={configureStore({
        reducer: { settings: settingsReducer },
        preloadedState: { settings: initialSettingsState },
    })}>
        <GlassButton
            onPress={onPress}
            accessibilityLabel="Close"
            testID="close-button"
            iconName="close"
            iconType="ionicon"
            iconSize={18}
            iconColor="#000000"
        />
    </Provider>
);

describe('GlassButton', () => {
    beforeEach(() => {
        mockLiquidGlass = false;
    });

    it.each([
        ['liquid glass', true],
        ['the flat fallback', false],
    ])('stays pressable by its label on %s', (_material, available) => {
        mockLiquidGlass = available;
        const onPress = jest.fn();

        const { getByLabelText } = renderButton(onPress);
        fireEvent.press(getByLabelText('Close'));

        expect(onPress).toHaveBeenCalledTimes(1);
    });
});
