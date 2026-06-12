import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../../redux/GamesSlice';
import playersReducer from '../../../redux/PlayersSlice';
import settingsReducer, { toggleHomeFullscreen } from '../../../redux/SettingsSlice';

jest.mock('../Sheets/GameSheet', () => ({ bottomSheetHeight: 80 }));

jest.mock('../Interactions/Dial/DialOverlay', () => {
    return function MockDialOverlay() {
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
        Easing: {
            out: () => () => 0,
            in: () => () => 0,
            cubic: () => 0,
        },
    };
});

let mockSafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => mockSafeAreaInsets,
}));

jest.mock('react-native-elements', () => ({
    Icon: () => null,
}));

let mockMenuOpen = false;
jest.mock('../MenuOpenContext', () => ({
    useMenuOpen: () => ({ menuOpen: mockMenuOpen, setMenuOpen: jest.fn() }),
}));

import ListBoard from './ListBoard';

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
    fireEvent(getByTestId('list-board-container'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 600 } },
    });
    fireEvent(getByTestId('player-row-0'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 60 } },
    });
}

describe('ListBoard', () => {
    beforeEach(() => {
        mockMenuOpen = false;
        mockSafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 };
    });

    it('opens the overlay when the game is unlocked and menu is closed', () => {
        const store = createStore();
        const { getByTestId, queryByTestId, getByText } = render(
            <Provider store={store}><ListBoard showHint={false} /></Provider>
        );

        expect(queryByTestId('inline-expand-overlay')).toBeNull();
        fireLayouts(getByTestId);
        fireEvent.press(getByText('Player 1'));
        expect(getByTestId('inline-expand-overlay')).toBeTruthy();
    });

    it('does not open the overlay when the game is locked', () => {
        const store = createStore({ locked: true });
        const { getByTestId, queryByTestId, getByText } = render(
            <Provider store={store}><ListBoard showHint={false} /></Provider>
        );

        fireLayouts(getByTestId);
        fireEvent.press(getByText('Player 1'));
        expect(queryByTestId('inline-expand-overlay')).toBeNull();
    });

    it('does not open the overlay when the menu is open', () => {
        mockMenuOpen = true;
        const store = createStore();
        const { getByTestId, queryByTestId, getByText } = render(
            <Provider store={store}><ListBoard showHint={false} /></Provider>
        );

        fireLayouts(getByTestId);
        fireEvent.press(getByText('Player 1'));
        expect(queryByTestId('inline-expand-overlay')).toBeNull();
    });

    it('adds safe-area side insets to the row list padding', () => {
        mockSafeAreaInsets = { top: 0, bottom: 0, left: 24, right: 16 };
        const store = createStore();
        const { getByTestId } = render(
            <Provider store={store}><ListBoard showHint={false} /></Provider>
        );

        expect(StyleSheet.flatten(getByTestId('list-board-scroll').props.contentContainerStyle)).toEqual(
            expect.objectContaining({
                paddingLeft: 36,
                paddingRight: 28,
            })
        );
    });

    it('uses the bottom safe area when fullscreen removes the bottom sheet clearance', () => {
        mockSafeAreaInsets = { top: 0, bottom: 34, left: 0, right: 0 };
        const store = createStore();
        store.dispatch(toggleHomeFullscreen());
        const { getByTestId } = render(
            <Provider store={store}><ListBoard showHint={false} /></Provider>
        );

        expect(StyleSheet.flatten(getByTestId('list-board-scroll').props.contentContainerStyle)).toEqual(
            expect.objectContaining({
                paddingBottom: 44,
            })
        );
    });
});

describe('ListBoard — winner pill', () => {
    it('shows WINNER for a winner when the game is locked', () => {
        const store = createStore({ locked: true, winnerIds: ['player-1'] });
        const { getAllByText } = render(<Provider store={store}><ListBoard showHint={false} /></Provider>);
        expect(getAllByText('WINNER').length).toBeGreaterThanOrEqual(1);
    });

    it('does not show WINNER for a non-winner when the game is locked', () => {
        // player-1 is NOT a winner; only player-2 is
        const store = createStore({ locked: true, winnerIds: ['player-2'] }, ['player-1']);
        const { queryByText } = render(<Provider store={store}><ListBoard showHint={false} /></Provider>);
        expect(queryByText('WINNER')).toBeNull();
    });

    it('does not show WINNER when the game is unlocked', () => {
        const store = createStore({ locked: false, winnerIds: ['player-1'] });
        const { queryByText } = render(<Provider store={store}><ListBoard showHint={false} /></Provider>);
        expect(queryByText('WINNER')).toBeNull();
    });

    it('hides PREV and RND labels when the game is locked', () => {
        const store = createStore({ locked: true });
        const { queryByText } = render(<Provider store={store}><ListBoard showHint={false} /></Provider>);
        expect(queryByText('PREV')).toBeNull();
        expect(queryByText('RND')).toBeNull();
    });

    it('shows PREV and RND labels when the game is unlocked', () => {
        const store = createStore({ locked: false });
        const { getAllByText } = render(<Provider store={store}><ListBoard showHint={false} /></Provider>);
        expect(getAllByText('PREV').length).toBeGreaterThanOrEqual(1);
        expect(getAllByText('RND').length).toBeGreaterThanOrEqual(1);
    });
});
