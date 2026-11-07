import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react-native';
import { Dimensions, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer from '../../redux/SettingsSlice';
import { useNavigationMock } from '../../test/test-helpers';

import GameScreen, { boardResizeTransition } from './GameScreen';

const mockHeaderItems = [{ type: 'menu', label: 'Game Options' }];

let mockHeaderHeight = 88;
jest.mock('@react-navigation/elements', () => ({
    useHeaderHeight: () => mockHeaderHeight,
}));

let mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => mockInsets,
}));

jest.mock('react-native-reanimated', () => {
    const View = jest.requireActual('react-native').View;
    const builder = { duration: jest.fn(), easing: jest.fn() };
    builder.duration.mockReturnValue(builder);
    builder.easing.mockReturnValue(builder);
    return {
        __esModule: true,
        default: { View },
        Easing: {
            cubic: jest.fn(),
            out: jest.fn(() => jest.fn()),
        },
        FadeIn: builder,
        FadeOut: builder,
        LinearTransition: builder,
        useReducedMotion: jest.fn(() => false),
        useSharedValue: (value: number) => ({ value }),
        useAnimatedStyle: (style: () => object) => style(),
        withTiming: jest.fn((value: number) => value),
    };
});

jest.mock('@gorhom/bottom-sheet', () => {
    const { forwardRef, useImperativeHandle } = jest.requireActual('react');
    const RN = jest.requireActual('react-native');
    const View = RN.View;

    const MockBottomSheetModal = forwardRef((_: Record<string, unknown>, ref: React.Ref<{ present: () => void; close: () => void; dismiss: () => void }>) => {
        useImperativeHandle(ref, () => ({
            present: jest.fn(),
            close: jest.fn(),
            dismiss: jest.fn(),
        }));

        return <View />;
    });

    return {
        __esModule: true,
        default: MockBottomSheetModal,
        BottomSheetModal: MockBottomSheetModal,
        BottomSheetScrollView: RN.ScrollView,
        BottomSheetBackdrop: () => <View />,
    };
});

jest.mock('../components/Sheets/GameSheet', () => ({ bottomSheetHeight: 80 }));

// Docked across the iPhone Duo's fold, which splits through the middle of the
// window. (Docking in a wide window is covered by the hook's own tests.)
let mockDock: 'columns' | 'rows' | null = null;
jest.mock('../hooks/useExpandedGameLayout', () => {
    const actual = jest.requireActual('../hooks/useExpandedGameLayout');
    return {
        ...actual,
        useGameDock: () => mockDock,
        useGameDockLayout: () => (mockDock == null ? null : `${mockDock}-fold`),
        useGameDockBounds: (dock: 'columns' | 'rows' | null) => actual.useFoldSplitBounds(dock),
    };
});

// Mock the components that GameScreen uses
jest.mock('../components/Buttons/GameOptionsButton', () => ({
    __esModule: true,
    default: () => null,
    useGameOptionsHeaderItems: () => mockHeaderItems,
}));

jest.mock('../components/Boards/TileBoard', () => {
    return function MockTileBoard({ boardSize, boardOrigin }: {
        boardSize: { width: number; height: number };
        boardOrigin?: { x: number; y: number };
    }) {
        const { View, Text } = jest.requireActual('react-native');
        return <View testID="tile-board" boardSize={boardSize} boardOrigin={boardOrigin}><Text>TileBoard</Text></View>;
    };
});

jest.mock('../components/Boards/ListBoard', () => {
    return function MockListBoard() {
        const { View, Text } = jest.requireActual('react-native');
        return <View testID="list-board"><Text>ListBoard</Text></View>;
    };
});

jest.mock('../components/LockedGameHint', () => {
    return function MockLockedGameHint() {
        const { View } = jest.requireActual('react-native');
        return <View testID="locked-game-hint" />;
    };
});

jest.mock('../components/GestureHintToast', () => {
    return function MockGestureHintToast() {
        const { View } = jest.requireActual('react-native');
        return <View testID="gesture-hint-toast" />;
    };
});

jest.mock('../components/GestureNudge', () => {
    return function MockGestureNudge() {
        const { View } = jest.requireActual('react-native');
        return <View testID="gesture-nudge" />;
    };
});

jest.mock('../components/Sheets/PointValuesSheet', () => {
    return function MockPointValuesSheet() {
        const { View, Text } = jest.requireActual('react-native');
        return <View testID="point-values-sheet"><Text>PointValuesSheet</Text></View>;
    };
});

jest.mock('../components/Sheets/GestureInfoSheet', () => {
    return function MockGestureInfoSheet() {
        const { View, Text } = jest.requireActual('react-native');
        return <View testID="gesture-info-sheet"><Text>GestureInfoSheet</Text></View>;
    };
});

jest.mock('../components/Sheets/ChooseWinnersSheet', () => {
    return function MockChooseWinnersSheet() {
        const { View, Text } = jest.requireActual('react-native');
        return <View testID="choose-winners-sheet"><Text>ChooseWinnersSheet</Text></View>;
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
    const navigation = useNavigationMock();

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
                <GameScreen navigation={navigation} />
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
                <GameScreen navigation={navigation} />
            </Provider>
        );

        expect(getByTestId('tile-board')).toBeTruthy();
        expect(getByTestId('point-values-sheet')).toBeTruthy();
    });

    it('should render ListBoard when interactionType is Dial', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
                interactionType: 'dial',
            },
            games: {
                entities: { 'game-1': mockGame },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <GameScreen navigation={navigation} />
            </Provider>
        );

        expect(getByTestId('list-board')).toBeTruthy();
    });

    it('sets native header items so iPhone Duo can move them into the vertical bar', () => {
        const store = createMockStore({
            settings: { currentGameId: 'game-1' },
            games: { entities: { 'game-1': mockGame }, ids: ['game-1'] },
            players: { entities: mockPlayers, ids: ['player-1', 'player-2'] },
        });

        render(
            <Provider store={store}>
                <GameScreen navigation={navigation} />
            </Provider>
        );

        const options = (navigation.setOptions as jest.Mock).mock.calls.at(-1)[0];
        expect(options.unstable_headerRightItems()).toBe(mockHeaderItems);
    });

    describe('on a partially open iPhone Duo', () => {
        const renderGame = (settings: Record<string, unknown> = {}) => {
            const store = createMockStore({
                settings: { currentGameId: 'game-1', ...settings },
                games: { entities: { 'game-1': mockGame }, ids: ['game-1'] },
                players: { entities: mockPlayers, ids: ['player-1', 'player-2'] },
            });

            return render(
                <Provider store={store}>
                    <GameScreen navigation={navigation} />
                </Provider>
            );
        };

        afterEach(() => {
            mockInsets = { top: 0, bottom: 0, left: 0, right: 0 };
            mockDock = null;
        });

        it('fills the screen with the board when flat, above the collapsed sheet', () => {
            const { getByTestId } = renderGame();
            const { width, height } = Dimensions.get('window');

            // Header (88) and the collapsed sheet (80 + 2) are outside the board's frame.
            expect(StyleSheet.flatten(getByTestId('game-board-area').props.style)).toEqual({
                position: 'absolute', top: 0, left: 0, opacity: 1, width, height: height - 88 - 82,
            });
            expect(getByTestId('tile-board').props.boardSize).toEqual({ width, height: height - 88 - 82 });
        });

        it('keeps only a small bottom margin in fullscreen, which hides the sheet', () => {
            const { getByTestId } = renderGame({ home_fullscreen: true });
            const { height } = Dimensions.get('window');

            expect(getByTestId('tile-board').props.boardSize.height).toBe(height - 88 - 20);
        });

        // The board's frame is exactly where the tiles are, so the fold resize
        // animates from the old tiles rather than from padding beside them.
        it('keeps the tiles\' frame inside the side safe areas', () => {
            mockInsets = { top: 0, bottom: 0, left: 12, right: 28 };
            const { width } = Dimensions.get('window');
            const { getByTestId } = renderGame();

            expect(StyleSheet.flatten(getByTestId('game-board-area').props.style)).toMatchObject({ left: 12, width: width - 40 });
            expect(getByTestId('tile-board').props.boardOrigin).toEqual({ x: 12, y: 88 });
        });

        it('ignores the right safe area when docked on the left half', () => {
            mockInsets = { top: 0, bottom: 0, left: 12, right: 28 };
            mockDock = 'columns';
            const { width } = Dimensions.get('window');
            const { getByTestId } = renderGame();

            expect(StyleSheet.flatten(getByTestId('game-board-area').props.style)).toMatchObject({ left: 12, width: width / 2 - 16 - 12 });
        });

        it('keeps the board to the left of the fold in landscape', () => {
            mockDock = 'columns';
            const { width, height } = Dimensions.get('window');
            const { getByTestId } = renderGame();

            const style = StyleSheet.flatten(getByTestId('game-board-area').props.style);
            expect(style).toEqual({ position: 'absolute', left: 0, top: 0, opacity: 1, height: height - 88, width: width / 2 - 16 });
            expect(getByTestId('tile-board').props.boardSize).toEqual({ width: width / 2 - 16, height: height - 88 });
            expect(getByTestId('game-board-area').findByProps({ testID: 'locked-game-hint' })).toBeTruthy();
            // The gesture toasts stay on the board's half too.
            expect(getByTestId('game-board-area').findByProps({ testID: 'gesture-hint-toast' })).toBeTruthy();
            expect(getByTestId('game-board-area').findByProps({ testID: 'gesture-nudge' })).toBeTruthy();
        });

        it('keeps the board above the fold in portrait, below the header', () => {
            mockDock = 'rows';
            const { width, height } = Dimensions.get('window');
            const { getByTestId } = renderGame();

            const style = StyleSheet.flatten(getByTestId('game-board-area').props.style);
            expect(style).toEqual({ position: 'absolute', left: 0, width, top: 0, opacity: 1, height: height / 2 - 16 - 88 });
            expect(getByTestId('tile-board').props.boardSize).toEqual({ width, height: height / 2 - 16 - 88 });
        });
    });

    describe('boardResizeTransition', () => {
        // Folding into book mode in landscape: the full-width board moves to the left half.
        const values = {
            currentOriginX: 0, currentOriginY: 0, currentWidth: 951, currentHeight: 600,
            targetOriginX: 0, targetOriginY: 0, targetWidth: 459, targetHeight: 600,
        } as Parameters<ReturnType<typeof boardResizeTransition>>[0];

        it('starts the new board stretched over the old frame, anchored at the top left', () => {
            const { initialValues, animations } = boardResizeTransition(false)(values);

            expect(initialValues).toMatchObject({ originX: 0, originY: 0, width: 459, height: 600 });
            expect((initialValues as { transform: unknown }).transform).toEqual([
                { translateX: 246 },
                { translateY: 0 },
                { scaleX: 951 / 459 },
                { scaleY: 1 },
            ]);
            expect((animations as { transform: unknown }).transform).toEqual([
                { translateX: 0 },
                { translateY: 0 },
                { scaleX: 1 },
                { scaleY: 1 },
            ]);
        });

        it('fades the board in instead with Reduce Motion', () => {
            const { initialValues, animations } = boardResizeTransition(true)(values);

            expect(initialValues).toMatchObject({ width: 459, height: 600, opacity: 0 });
            expect(initialValues).not.toHaveProperty('transform');
            expect(animations).toEqual({ opacity: 1 });
        });
    });

    it('uses the header height it last measured at a window size on returning to it', () => {
        const store = createMockStore({
            settings: { currentGameId: 'game-1' },
            games: { entities: { 'game-1': mockGame }, ids: ['game-1'] },
            players: { entities: mockPlayers, ids: ['player-1', 'player-2'] },
        });
        const dims = jest.spyOn(jest.requireActual('react-native'), 'useWindowDimensions');
        const screen = () => (
            <Provider store={store}>
                <GameScreen navigation={navigation} />
            </Provider>
        );
        const paddingTop = (view: ReturnType<typeof render>) =>
            StyleSheet.flatten(view.getByTestId('game-screen').props.style).paddingTop;

        dims.mockReturnValue({ width: 466, height: 678, scale: 3, fontScale: 1 });
        mockHeaderHeight = 82;
        const view = render(screen());
        expect(paddingTop(view)).toBe(82);

        // Another display: its header is measured a few renders later, and the
        // renders before that still report the first display's height.
        dims.mockReturnValue({ width: 669, height: 951, scale: 3, fontScale: 1 });
        mockHeaderHeight = 82;
        view.rerender(screen());
        view.rerender(screen());
        view.rerender(screen());
        mockHeaderHeight = 50;
        view.rerender(screen());
        expect(paddingTop(view)).toBe(50);

        // Back on the first display, before its header is measured again, over
        // several stale renders: neither display's height is overwritten.
        dims.mockReturnValue({ width: 466, height: 678, scale: 3, fontScale: 1 });
        view.rerender(screen());
        view.rerender(screen());
        expect(paddingTop(view)).toBe(82);

        dims.mockReturnValue({ width: 669, height: 951, scale: 3, fontScale: 1 });
        view.rerender(screen());
        expect(paddingTop(view)).toBe(50);

        dims.mockRestore();
        mockHeaderHeight = 88;
    });
});
