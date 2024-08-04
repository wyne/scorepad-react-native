import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer, { gameDefaults } from '../redux/GamesSlice';
import settingsReducer, { setOnboardedVersion, initialState as settingsState } from '../redux/SettingsSlice';

import { Navigation } from './Navigation';
import { useNavigationMock } from '../test/test-helpers';
import ListScreen from './screens/ListScreen';

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
    it('show the onboarding screen when onboardedSemVer 1.0.0', async () => {
        const navigation = useNavigationMock();
        const { Application } = require('expo-application');
        expect(Application.nativeApplicationVersion).toBe('1.0.0');

        const store = mockStore();

        render(
            <Provider store={store}>
                <ListScreen navigation={navigation} />
            </Provider>
        );

        await waitFor(() => {
            expect(navigation.navigate).toHaveBeenCalledWith('Onboarding', expect.objectContaining({
                onboarding: true,
            }));
        });
    });

    it('does not show the onboarding screen when onboardedSemVer is equal or greater than 2.2.2', async () => {
        const navigation = useNavigationMock();

        jest.doMock('expo-application', () => ({
            Application: {
                nativeApplicationVersion: '2.5.7',
            },
        }));

        const { Application } = require('expo-application');
        expect(Application.nativeApplicationVersion).toBe('2.5.7');

        const store = mockStore();

        render(
            <Provider store={store}>
                <ListScreen navigation={navigation} />
            </Provider>
        );

        await waitFor(() => {
            expect(navigation.navigate).not.toHaveBeenCalledWith('Onboarding');
        });
    });
});
