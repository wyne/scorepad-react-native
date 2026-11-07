import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render } from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';
import { BackHandler, StyleSheet } from 'react-native';
import { SharedValue } from 'react-native-reanimated';
import { Provider } from 'react-redux';

import gamesReducer, { gameSave } from '../../../../redux/GamesSlice';
import playersReducer, { playerAdd } from '../../../../redux/PlayersSlice';
import settingsReducer from '../../../../redux/SettingsSlice';
import * as Analytics from '../../../Analytics';

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
    selectionAsync: jest.fn(),
    ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium' },
}));

// Capture the callbacks the overlay passes down so tests can drive a score change /
// step toggle through the (otherwise inert) mocked dial control.
let mockDialOnChange: ((v: number) => void) | undefined;
let mockDialOnToggleMode: ((secondary: boolean) => void) | undefined;
jest.mock('./DialControl', () => {
    return function MockDialControl(
        { dialSize, onChange, onToggleMode }:
            { dialSize: number; onChange: (v: number) => void; onToggleMode: (secondary: boolean) => void },
    ) {
        const { View } = jest.requireActual('react-native');
        mockDialOnChange = onChange;
        mockDialOnToggleMode = onToggleMode;
        return <View testID="dial-control" style={{ width: dialSize, height: dialSize }} />;
    };
});

jest.mock('../../../Analytics', () => ({ logEvent: jest.fn() }));

let mockMenuOpen = false;
jest.mock('../../MenuOpenContext', () => ({
    useMenuOpen: () => ({ menuOpen: mockMenuOpen, setMenuOpen: jest.fn() }),
}));


import DialOverlay, { dismissExitDuration, dragOffset, portraitDialSize, shouldDismiss } from './DialOverlay';

const mkSv = <T,>(v: T) => ({ value: v }) as unknown as SharedValue<T>;

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
            settings: { currentGameId: 'game-1', addendOne: 1, addendTwo: 5 },
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
    boardWidth: 400,
    boardHeight: 700,
    safeAreaTop: 0,
    safeAreaLeft: 0,
    safeAreaRight: 0,
    safeAreaBottom: 0,
    onClose: jest.fn(),
    svOpacity: mkSv(1),
    svSlideY: mkSv(0),
    svDragY: mkSv(0),
};

const wrap = (
    store: ReturnType<typeof createStore>,
    onClose = jest.fn(),
    propOverrides: Partial<typeof defaultProps> = {},
) => (
    <Provider store={store}>
        <DialOverlay {...defaultProps} {...propOverrides} onClose={onClose} />
    </Provider>
);

// ─── tests ────────────────────────────────────────────────────────────────────

describe('DialOverlay', () => {
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

    it('closes on Android back instead of leaving the game', () => {
        let onBack: Parameters<typeof BackHandler.addEventListener>[1] | undefined;
        const spy = jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_e, handler) => {
            onBack = handler;
            return { remove: jest.fn() };
        });
        const onClose = jest.fn();
        render(wrap(createStore(), onClose));

        let handled: boolean | null | undefined;
        act(() => { handled = onBack?.({} as Parameters<NonNullable<typeof onBack>>[0]); });
        expect(handled).toBe(true);
        expect(onClose).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });

    it('ticks a selection haptic when paging to another player', () => {
        const store = createStore({ playerIds: ['player-1', 'player-2'] });
        store.dispatch(playerAdd({ id: 'player-2', playerName: 'Player 2', scores: [0] }));
        const { UNSAFE_getByProps } = render(wrap(store, jest.fn(), { playerIds: ['player-1', 'player-2'] }));
        const list = UNSAFE_getByProps({ horizontal: true, pagingEnabled: true });
        jest.mocked(Haptics.selectionAsync).mockClear();

        act(() => { list.props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: 400 } } }); });
        expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);

        // Settling back on the same page is not a change.
        act(() => { list.props.onMomentumScrollEnd({ nativeEvent: { contentOffset: { x: 400 } } }); });
        expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
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

    it('centers a bounded portrait card inside a full-width tablet page', () => {
        const { getByTestId } = render(wrap(createStore(), jest.fn(), {
            boardWidth: 1024,
            boardHeight: 1100,
        }));

        expect(StyleSheet.flatten(getByTestId('dial-page-frame').props.style)).toEqual(
            expect.objectContaining({
                alignItems: 'center',
                justifyContent: 'center',
                width: 1024,
            })
        );
        expect(StyleSheet.flatten(getByTestId('dial-card').props.style)).toEqual(
            expect.objectContaining({
                height: 720,
                width: 560,
            })
        );
        expect(StyleSheet.flatten(getByTestId('dial-control').props.style).width).toBeGreaterThan(240);
    });

    it('grows the portrait dial to fill the card, with drag zones above and below it', () => {
        // iPhone 15-sized board: card 369 x 651.
        const { getByTestId } = render(wrap(createStore(), jest.fn(), { boardWidth: 393, boardHeight: 675 }));
        expect(StyleSheet.flatten(getByTestId('dial-card').props.style)).toEqual(
            expect.objectContaining({ width: 369, height: 651 })
        );
        expect(StyleSheet.flatten(getByTestId('dial-control').props.style).width).toBe(300);
        expect(StyleSheet.flatten(getByTestId('dial-drag-upper').props.style).flexGrow).toBe(1);
        expect(StyleSheet.flatten(getByTestId('dial-drag-lower').props.style).flexGrow).toBe(1);
    });

    it('keeps the card clear of the bottom safe area', () => {
        // Fullscreen: the board runs under the home indicator.
        const { getByTestId } = render(wrap(createStore(), jest.fn(), {
            boardWidth: 393,
            boardHeight: 700,
            safeAreaBottom: 34,
        }));

        expect(StyleSheet.flatten(getByTestId('dial-card').props.style).height).toBe(700 - 12 - 34);
    });

    it('keeps the page and card within the side safe area', () => {
        // iPhone Duo outer display: the vertical bar takes the right edge.
        const { getByTestId } = render(wrap(createStore(), jest.fn(), {
            boardWidth: 466,
            boardHeight: 600,
            safeAreaRight: 60,
        }));

        expect(StyleSheet.flatten(getByTestId('dial-page-frame').props.style).width).toBe(406);
        expect(StyleSheet.flatten(getByTestId('dial-card').props.style).width).toBe(406 - 24);
    });

    it('uses the landscape card dimensions instead of raw board width for dial sizing', () => {
        const { getByTestId } = render(wrap(createStore(), jest.fn(), {
            boardWidth: 1100,
            boardHeight: 650,
        }));

        expect(StyleSheet.flatten(getByTestId('dial-card').props.style)).toEqual(
            expect.objectContaining({
                height: 626,
                width: 760,
            })
        );
        expect(StyleSheet.flatten(getByTestId('dial-control').props.style)).toEqual(
            expect.objectContaining({
                height: 236,
                width: 236,
            })
        );
    });

    // --- analytics ---

    it('logs a score_change with the primary step (addendOne) when the dial increments', () => {
        const mockLogEvent = jest.mocked(Analytics.logEvent);
        render(wrap(createStore())); // player starts the round at 5; addendOne is 1

        act(() => { mockDialOnChange?.(8); });

        expect(mockLogEvent).toHaveBeenCalledWith('score_change', {
            player_index: 0,
            game_id: 'game-1',
            addend: 1,
            round: 0,
            type: 'increment',
            power_hold: false,
            notches: 3,
            interaction: 'dial',
        });
    });

    it('logs a decrement when the dial lowers the score', () => {
        const mockLogEvent = jest.mocked(Analytics.logEvent);
        render(wrap(createStore())); // player starts the round at 5

        act(() => { mockDialOnChange?.(2); });

        expect(mockLogEvent).toHaveBeenCalledWith('score_change', expect.objectContaining({
            addend: 1,
            type: 'decrement',
            notches: -3,
            interaction: 'dial',
        }));
    });

    it('logs the secondary step (addendTwo) and power_hold when in secondary mode', () => {
        const mockLogEvent = jest.mocked(Analytics.logEvent);
        render(wrap(createStore())); // addendTwo is 5

        act(() => { mockDialOnToggleMode?.(true); });
        act(() => { mockDialOnChange?.(10); });

        expect(mockLogEvent).toHaveBeenCalledWith('score_change', expect.objectContaining({
            addend: 5,
            power_hold: true,
            type: 'increment',
            notches: 1,
            interaction: 'dial',
        }));
    });

    it('does not log a score_change when the value is unchanged', () => {
        const mockLogEvent = jest.mocked(Analytics.logEvent);
        render(wrap(createStore())); // player starts the round at 5

        act(() => { mockDialOnChange?.(5); });

        expect(mockLogEvent).not.toHaveBeenCalled();
    });
});

describe('dismissExitDuration', () => {
    it('matches a fast throw so the card leaves at the release speed', () => {
        // Ease-out quad starts at 2 x distance / duration: 600 px at 4000 px/s is 300 ms.
        expect(dismissExitDuration(600, 4000)).toBe(300);
    });

    it('uses a speed floor so slow releases still exit promptly', () => {
        expect(dismissExitDuration(600, 0)).toBe(320);
        expect(dismissExitDuration(100, 200)).toBe(200);
    });

    it('never runs shorter than the minimum', () => {
        expect(dismissExitDuration(50, 10000)).toBe(150);
        expect(dismissExitDuration(-10, 5000)).toBe(150);
    });
});

describe('dragOffset', () => {
    it('follows the finger 1:1 downward', () => {
        expect(dragOffset(0)).toBe(0);
        expect(dragOffset(300)).toBe(300);
    });

    it('rubber-bands upward and never passes the limit', () => {
        expect(dragOffset(-40)).toBe(-20);
        expect(dragOffset(-1000)).toBeGreaterThan(-40);
        expect(dragOffset(-1000)).toBeLessThan(-35);
    });
});

describe('shouldDismiss', () => {
    const card = 600; // threshold 150 px

    it('stays open for a short, slow pull', () => {
        expect(shouldDismiss(60, 0, card)).toBe(false);
    });

    it('dismisses a slow pull past a quarter of the card', () => {
        expect(shouldDismiss(160, 0, card)).toBe(true);
    });

    it('counts the throw: a medium pull released moving down dismisses', () => {
        expect(shouldDismiss(80, 600, card)).toBe(true);
    });

    it('dismisses a short hard flick', () => {
        expect(shouldDismiss(15, 1500, card)).toBe(true);
    });

    it('cancels when flicked back up, however far it was dragged', () => {
        expect(shouldDismiss(300, -500, card)).toBe(false);
    });

    it('keeps the threshold within bounds on very short and very tall cards', () => {
        expect(shouldDismiss(79, 0, 200)).toBe(false);
        expect(shouldDismiss(161, 0, 2000)).toBe(true);
    });
});

describe('portraitDialSize', () => {
    it('takes the height left after the fixed chrome on a phone card', () => {
        expect(portraitDialSize(369, 651, 1)).toBe(300);
    });

    it('is limited by the card width on a tall, narrow card', () => {
        expect(portraitDialSize(300, 1000, 1)).toBe(239);
    });

    it('never shrinks below a usable minimum', () => {
        expect(portraitDialSize(300, 400, 1)).toBe(120);
    });
});
