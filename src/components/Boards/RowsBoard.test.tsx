import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../../redux/GamesSlice';
import playersReducer from '../../../redux/PlayersSlice';
import settingsReducer from '../../../redux/SettingsSlice';

jest.mock('../Sheets/GameSheet', () => ({ bottomSheetHeight: 80 }));

jest.mock('../Interactions/Radial/InlineExpandOverlay', () => {
    return function MockInlineExpandOverlay() {
        const { View } = jest.requireActual('react-native');
        return <View testID="inline-expand-overlay" />;
    };
});

jest.mock('react-native-reanimated', () => {
    const { View } = jest.requireActual('react-native');
    return {
        __esModule: true,
        default: { View },
        useSharedValue: (v: unknown) => ({ value: v }),
        useAnimatedStyle: () => ({}),
        withTiming: (v: unknown) => v,
    };
});

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

let mockMenuOpen = false;
jest.mock('../MenuOpenContext', () => ({
    useMenuOpen: () => ({ menuOpen: mockMenuOpen, setMenuOpen: jest.fn() }),
}));

import RowsBoard from './RowsBoard';

const createStore = (gameOverrides: Record<string, unknown> = {}, playerIds = ['player-1', 'player-2']) => {
    const players = Object.fromEntries(
        playerIds.map((id) => [id, { id, playerName: `Player ${id.split('-')[1]}`, scores: [0] }])
    );
    return configureStore({
        reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
        preloadedState: {
            settings: { currentGameId: 'game-1' },
            games: {
                entities: {
                    'game-1': {
                        id: 'game-1',
                        title: 'Test',
                        dateCreated: 0,
                        roundCurrent: 0,
                        roundTotal: 1,
                        playerIds,
                        ...gameOverrides,
                    },
                },
                ids: ['game-1'],
            },
            players: { entities: players, ids: playerIds },
        } as Parameters<typeof configureStore>[0]['preloadedState'],
    });
};

/** Fire layout events so handleRowPress passes the layout guards. */
function fireLayouts(getByTestId: ReturnType<typeof render>['getByTestId']) {
    fireEvent(getByTestId('rows-board-container'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 600 } },
    });
    fireEvent(getByTestId('player-row-player-1'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 60 } },
    });
}

describe('RowsBoard', () => {
    beforeEach(() => {
        mockMenuOpen = false;
    });

    it('opens the overlay when the game is unlocked and menu is closed', () => {
        const store = createStore();
        const { getByTestId, queryByTestId, getByText } = render(
            <Provider store={store}><RowsBoard /></Provider>
        );

        expect(queryByTestId('inline-expand-overlay')).toBeNull();
        fireLayouts(getByTestId);
        fireEvent.press(getByText('Player 1'));
        expect(getByTestId('inline-expand-overlay')).toBeTruthy();
    });

    it('does not open the overlay when the game is locked', () => {
        const store = createStore({ locked: true });
        const { getByTestId, queryByTestId, getByText } = render(
            <Provider store={store}><RowsBoard /></Provider>
        );

        fireLayouts(getByTestId);
        fireEvent.press(getByText('Player 1'));
        expect(queryByTestId('inline-expand-overlay')).toBeNull();
    });

    it('does not open the overlay when the menu is open', () => {
        mockMenuOpen = true;
        const store = createStore();
        const { getByTestId, queryByTestId, getByText } = render(
            <Provider store={store}><RowsBoard /></Provider>
        );

        fireLayouts(getByTestId);
        fireEvent.press(getByText('Player 1'));
        expect(queryByTestId('inline-expand-overlay')).toBeNull();
    });
});
