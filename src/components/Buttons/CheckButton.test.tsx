import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer, { gameDefaults } from '../../../redux/GamesSlice';
import settingsReducer, { initialState as settingsState } from '../../../redux/SettingsSlice';
import { useNavigationMock } from '../../../test/test-helpers';
import { logEvent } from '../../Analytics';

import CheckButton from './CheckButton';

jest.mock('../../Analytics');

const getStore = () => {
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

describe('CheckButton', () => {
    const navigation = useNavigationMock();

    it('should navigate to Game screen when pressed', async () => {
        const store = getStore();

        const { getByRole } = render(
            <Provider store={store}>
                <CheckButton navigation={navigation} route={{ key: 'Settings', name: 'Settings', params: { source: 'new_game' } }} />
            </Provider>
        );

        const button = getByRole('button');
        fireEvent.press(button);

        await waitFor(() => {
            expect(navigation.navigate).toHaveBeenCalledWith('Game');
        });
    });

    it('should navigate back a screen when pressed', async () => {
        const store = getStore();

        const { getByRole } = render(
            <Provider store={store}>
                <CheckButton navigation={navigation} route={{ key: 'Settings', name: 'Settings', params: { source: 'list_screen' } }} />
            </Provider>
        );

        const button = getByRole('button');
        fireEvent.press(button);

        await waitFor(() => {
            expect(navigation.navigate).toHaveBeenCalledWith('List');
        });
    });

    it('should log an analytics event when pressed', async () => {
        const store = getStore();

        const { getByRole } = render(
            <Provider store={store}>
                <CheckButton navigation={navigation} />
            </Provider>
        );

        const button = getByRole('button');
        fireEvent.press(button);

        await waitFor(() => {
            expect(logEvent).toHaveBeenCalledWith('save_game', expect.any(Object));
        });
    });
});
