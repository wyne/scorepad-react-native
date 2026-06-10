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

jest.mock('react-native-reanimated', () => {
    const View = jest.requireActual('react-native').View;
    const builder = { duration: jest.fn() };
    builder.duration.mockReturnValue(builder);
    return {
        __esModule: true,
        default: { View },
        FadeIn: builder,
        FadeOut: builder,
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

// Mock the components that GameScreen uses
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
                <GameScreen />
            </Provider>
        );

        expect(getByTestId('list-board')).toBeTruthy();
    });
});
