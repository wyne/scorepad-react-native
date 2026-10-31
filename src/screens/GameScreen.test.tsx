import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react-native';
import { Dimensions, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer from '../../redux/SettingsSlice';
import { useNavigationMock } from '../../test/test-helpers';

import GameScreen from './GameScreen';

const mockHeaderItems = [{ type: 'menu', label: 'Game Options' }];

jest.mock('@react-navigation/elements', () => ({
    useHeaderHeight: () => 88,
}));

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
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

jest.mock('../hooks/useExpandedGameLayout', () => ({
    ...jest.requireActual('../hooks/useExpandedGameLayout'),
    useGameFoldSplit: jest.fn(() => null),
}));

const mockUseGameFoldSplit: jest.Mock = jest.requireMock('../hooks/useExpandedGameLayout').useGameFoldSplit;

// Mock the components that GameScreen uses
jest.mock('../components/Buttons/GameOptionsButton', () => ({
    __esModule: true,
    default: () => null,
    useGameOptionsHeaderItems: () => mockHeaderItems,
}));

jest.mock('../components/Boards/TileBoard', () => {
    return function MockTileBoard() {
        const { View, Text } = jest.requireActual('react-native');
        return <View testID="tile-board"><Text>TileBoard</Text></View>;
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
        const renderGame = () => {
            const store = createMockStore({
                settings: { currentGameId: 'game-1' },
                games: { entities: { 'game-1': mockGame }, ids: ['game-1'] },
                players: { entities: mockPlayers, ids: ['player-1', 'player-2'] },
            });

            return render(
                <Provider store={store}>
                    <GameScreen navigation={navigation} />
                </Provider>
            );
        };

        afterEach(() => mockUseGameFoldSplit.mockReturnValue(null));

        it('fills the screen with the board when flat', () => {
            const { getByTestId } = renderGame();

            expect(StyleSheet.flatten(getByTestId('game-board-area').props.style)).toEqual({ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 });
        });

        it('keeps the board to the left of the fold in landscape', () => {
            mockUseGameFoldSplit.mockReturnValue('columns');
            const { width } = Dimensions.get('window');
            const { getByTestId } = renderGame();

            const style = StyleSheet.flatten(getByTestId('game-board-area').props.style);
            expect(style).toMatchObject({ left: 0, top: 0, bottom: 0, width: width / 2 - 16 });
            expect(getByTestId('game-board-area').props.layout).toBeTruthy();
            expect(getByTestId('game-board-area').findByProps({ testID: 'locked-game-hint' })).toBeTruthy();
        });

        it('keeps the board above the fold in portrait, below the header', () => {
            mockUseGameFoldSplit.mockReturnValue('rows');
            const { height } = Dimensions.get('window');
            const { getByTestId } = renderGame();

            const style = StyleSheet.flatten(getByTestId('game-board-area').props.style);
            expect(style).toMatchObject({ left: 0, right: 0, top: 0, height: height / 2 - 16 - 88 });
        });
    });
});
