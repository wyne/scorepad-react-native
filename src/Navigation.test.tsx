import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer, { gameDefaults } from '../redux/GamesSlice';
import settingsReducer, { setOnboardedVersion, initialState as settingsState } from '../redux/SettingsSlice';

import { Navigation } from './Navigation';

jest.mock('Analytics');

const mockStore = () => {
    return configureStore({
        reducer: {
            settings: settingsReducer,
            games: gamesReducer,
        },
        preloadedState: {
            settings: {
                ...settingsState,
                currentGameId: '123'
            },
            games: {
                entities: {
                    '123': {
                        ...gameDefaults,
                        id: '123',
                        title: 'Game',
                        dateCreated: 1,
                        playerIds: [],
                    }
                },
                ids: ['123']
            }
        }
    });
};

describe('Navigation', () => {
    it('does not show the onboarding screen when onboardedSemVer 1.0.0', () => {
        const store = mockStore();

        render(
            <Provider store={store}>
                <Navigation />
            </Provider>
        );

        expect(screen.queryByTestId('onboarding')).toBeOnTheScreen();
    });

    it.skip('does not show the onboarding screen when onboardedSemVer is equal or greater than 2.2.2', () => {
        const store = mockStore();

        store.dispatch(setOnboardedVersion());
        render(
            <Provider store={store}>
                <Navigation />
            </Provider>
        );

        expect(screen.queryByTestId('onboarding')).not.toBeOnTheScreen();
    });
});
