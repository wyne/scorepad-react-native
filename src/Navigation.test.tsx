import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Navigation } from './Navigation';
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import { setOnboardedVersion } from '../redux/SettingsSlice';

describe('Navigation', () => {
    it('does not show the onboarding screen when onboardedSemVer 1.0.0', () => {
        render(
            <Provider store={store}>
                <Navigation />
            </Provider>
        );

        expect(screen.queryByTestId('onboarding')).toBeOnTheScreen();
    });

    it('does not show the onboarding screen when onboardedSemVer is equal or greater than 2.2.2', () => {
        store.dispatch(setOnboardedVersion());
        render(
            <Provider store={store}>
                <Navigation />
            </Provider>
        );

        expect(screen.queryByTestId('onboarding')).not.toBeOnTheScreen();
    });
});
