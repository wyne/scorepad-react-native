import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import { gameSave } from '../../../../redux/GamesSlice';
import gamesReducer from '../../../../redux/GamesSlice';
import playersReducer from '../../../../redux/PlayersSlice';
import settingsReducer from '../../../../redux/SettingsSlice';

jest.mock('react-native-reanimated', () => {
    const { View } = jest.requireActual('react-native');
    return {
        __esModule: true,
        default: { View },
        useSharedValue: (v: unknown) => ({ value: v }),
        useAnimatedStyle: () => ({}),
        // Synchronous callbacks so the onClose chain (withTiming → runOnJS(onClose)) fires immediately
        withTiming: (_v: unknown, _opts: unknown, cb?: (finished: boolean) => void) => {
            if (cb) cb(true);
            return _v;
        },
        withDelay: (_ms: number, v: unknown) => v,
        withSpring: (v: unknown) => v,
        runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
        Easing: {
            out: () => () => 0,
            in: () => () => 0,
            cubic: () => 0,
            quad: () => 0,
        },
        SharedValue: {},
    };
});

jest.mock('react-native-gesture-handler', () => ({
    __esModule: true,
    Gesture: {
        Pan: () => {
            const b: Record<string, (...args: unknown[]) => unknown> = {};
            const fluent = () => b;
            ['enabled', 'minDistance', 'activeOffsetY', 'failOffsetX',
                'onBegin', 'onUpdate', 'onEnd', 'onFinalize'].forEach((m) => { b[m] = fluent; });
            return b;
        },
    },
    GestureDetector: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium' },
}));

jest.mock('./DialControl', () => {
    return function MockDialControl() {
        const { View } = jest.requireActual('react-native');
        return <View testID="dial-control" />;
    };
});

let mockMenuOpen = false;
jest.mock('../../MenuOpenContext', () => ({
    useMenuOpen: () => ({ menuOpen: mockMenuOpen, setMenuOpen: jest.fn() }),
}));

import InlineExpandOverlay from './InlineExpandOverlay';

// ─── shared fixtures ──────────────────────────────────────────────────────────

const mockGame = {
    id: 'game-1',
    title: 'Test',
    dateCreated: 0,
    roundCurrent: 0,
    roundTotal: 1,
    playerIds: ['player-1'],
    locked: false,
};

const createStore = (gameOverrides: Record<string, unknown> = {}) =>
    configureStore({
        reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
        preloadedState: {
            settings: { currentGameId: 'game-1' },
            games: {
                entities: { 'game-1': { ...mockGame, ...gameOverrides } },
                ids: ['game-1'],
            },
            players: {
                entities: { 'player-1': { id: 'player-1', playerName: 'Player 1', scores: [5] } },
                ids: ['player-1'],
            },
        } as Parameters<typeof configureStore>[0]['preloadedState'],
    });

const defaultProps = {
    playerIds: ['player-1'],
    initialIndex: 0,
    rowRect: { top: 100, left: 0, width: 400, height: 60 },
    boardWidth: 400,
    boardHeight: 700,
    safeAreaTop: 0,
    onClose: jest.fn(),
};

const wrap = (store: ReturnType<typeof createStore>, onClose = jest.fn()) => (
    <Provider store={store}>
        <InlineExpandOverlay {...defaultProps} onClose={onClose} />
    </Provider>
);

// ─── tests ────────────────────────────────────────────────────────────────────

describe('InlineExpandOverlay', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockMenuOpen = false;
    });

    // --- rendering ---

    it('renders the player name', () => {
        const { getByText } = render(wrap(createStore()));
        expect(getByText('Player 1')).toBeTruthy();
    });

    it('renders the PREVIOUS TOTAL label', () => {
        const { getByText } = render(wrap(createStore()));
        expect(getByText('PREVIOUS TOTAL')).toBeTruthy();
    });

    it('renders null when there is no current game', () => {
        const store = configureStore({
            reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
            preloadedState: {
                settings: { currentGameId: undefined },
                games: { entities: {}, ids: [] },
                players: { entities: {}, ids: [] },
            } as Parameters<typeof configureStore>[0]['preloadedState'],
        });
        const { toJSON } = render(wrap(store));
        expect(toJSON()).toBeNull();
    });

    // --- Done button ---

    it('calls onClose when Done is pressed', () => {
        const onClose = jest.fn();
        const { getByText } = render(wrap(createStore(), onClose));
        fireEvent.press(getByText('Done'));
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose only once even if Done is pressed twice', () => {
        const onClose = jest.fn();
        const { getByText } = render(wrap(createStore(), onClose));
        fireEvent.press(getByText('Done'));
        fireEvent.press(getByText('Done'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    // --- backdrop ---

    it('calls onClose when the backdrop is pressed', () => {
        const onClose = jest.fn();
        const { getByTestId } = render(wrap(createStore(), onClose));
        fireEvent.press(getByTestId('overlay-backdrop'));
        expect(onClose).toHaveBeenCalled();
    });

    it('disables the backdrop when menuOpen is true', () => {
        mockMenuOpen = true;
        const { getByTestId } = render(wrap(createStore()));
        expect(getByTestId('overlay-backdrop').props.accessibilityState?.disabled).toBe(true);
    });

    it('enables the backdrop when menuOpen is false', () => {
        mockMenuOpen = false;
        const { getByTestId } = render(wrap(createStore()));
        expect(getByTestId('overlay-backdrop').props.accessibilityState?.disabled).toBeFalsy();
    });

    // --- locked game ---

    it('calls onClose when the game becomes locked while the overlay is open', () => {
        const store = createStore({ locked: false });
        const onClose = jest.fn();
        render(wrap(store, onClose));

        expect(onClose).not.toHaveBeenCalled();
        act(() => { store.dispatch(gameSave({ ...mockGame, locked: true })); });
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onClose immediately when rendered with an already-locked game', () => {
        const onClose = jest.fn();
        render(wrap(createStore({ locked: true }), onClose));
        expect(onClose).toHaveBeenCalled();
    });

    it('keeps the overlay open while the game remains unlocked', () => {
        const store = createStore({ locked: false });
        const onClose = jest.fn();
        render(wrap(store, onClose));

        act(() => { store.dispatch(gameSave({ ...mockGame, locked: false })); });
        expect(onClose).not.toHaveBeenCalled();
    });
});
