import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer from '../../redux/SettingsSlice';

import GameScreen from './GameScreen';

jest.mock('@react-navigation/elements', () => ({
    useHeaderHeight: () => 88,
}));

// Mock the components that GameScreen uses
jest.mock('../components/Boards/FlexboxBoard', () => {
    return function MockFlexboxBoard() {
        const { View, Text } = jest.requireActual('react-native');
        return <View testID="flexbox-board"><Text>FlexboxBoard</Text></View>;
    };
});

jest.mock('../components/Sheets/AddendModal', () => {
    return function MockAddendModal() {
        const { View, Text } = jest.requireActual('react-native');
        return <View testID="addend-modal"><Text>AddendModal</Text></View>;
    };
});


const createMockStore = (initialState: Parameters<typeof configureStore>[0]['preloadedState']) => {
    return configureStore({
        reducer: {
            settings: settingsReducer,
            games: gamesReducer,
            players: playersReducer,
        },
        preloadedState: initialState,
    });
};

describe('GameScreen', () => {
    const mockGame = {
        id: 'game-1',
        title: 'Test Game',
        dateCreated: Date.now(),
        roundCurrent: 0,
        roundTotal: 1,
        playerIds: ['player-1', 'player-2'],
    };

    const mockPlayers = {
        'player-1': {
            id: 'player-1',
            playerName: 'Player 1',
            scores: [10, 20],
        },
        'player-2': {
            id: 'player-2',
            playerName: 'Player 2',
            scores: [15, 25],
        },
    };

    it('should render null when no current game is set', () => {
        const store = createMockStore({
            settings: {
                currentGameId: undefined,
            },
            games: {
                entities: {},
                ids: [],
            },
            players: {
                entities: {},
                ids: [],
            },
        });

        const { toJSON } = render(
            <Provider store={store}>
                <GameScreen />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render game components when current game is set', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': mockGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <GameScreen />
            </Provider>
        );

        expect(getByTestId('flexbox-board')).toBeTruthy();
        expect(getByTestId('addend-modal')).toBeTruthy();
    });
});
