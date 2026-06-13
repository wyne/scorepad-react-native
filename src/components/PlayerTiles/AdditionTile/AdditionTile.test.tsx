import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer, { roundNext } from '../../../../redux/GamesSlice';
import playersReducer from '../../../../redux/PlayersSlice';
import settingsReducer from '../../../../redux/SettingsSlice';

import AdditionTile from './AdditionTile';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
    const View = jest.requireActual('react-native').View;
    const Text = jest.requireActual('react-native').Text;
    
    return {
        __esModule: true,
        default: {
            View: View,
            Text: Text,
        },
        useSharedValue: jest.fn((value) => ({ value })),
        useAnimatedStyle: jest.fn((callback) => callback()),
        withTiming: jest.fn((value) => value),
        ZoomIn: {
            duration: jest.fn(() => ({ duration: jest.fn() })),
        },
        ZoomOut: {
            duration: jest.fn(() => ({ duration: jest.fn() })),
        },
        LinearTransition: {
            easing: jest.fn(() => ({ duration: jest.fn() })),
        },
        Easing: {
            ease: jest.fn(),
        },
    };
});

// Mock the sub-components
jest.mock('./ScoreBefore', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function MockScoreBefore({ containerWidth, currentRoundScore, currentRoundTotalScore, fontColor }: {
        containerWidth: number;
        currentRoundScore: number;
        currentRoundTotalScore: number;
        fontColor: string;
    }) {
        const { View, Text } = jest.requireActual('react-native');
        return (
            <View testID="score-before">
                <Text>Before: {currentRoundTotalScore - currentRoundScore}</Text>
                <Text>Color: {fontColor}</Text>
                <Text>Width: {containerWidth}</Text>
            </View>
        );
    };
});

jest.mock('./ScoreRound', () => {
    return function MockScoreRound({ containerWidth, currentRoundScore, fontColor }: {
        containerWidth: number;
        currentRoundScore: number;
        fontColor: string;
    }) {
        const { View, Text } = jest.requireActual('react-native');
        return (
            <View testID="score-round">
                <Text>Round: {currentRoundScore}</Text>
                <Text>Color: {fontColor}</Text>
                <Text>Width: {containerWidth}</Text>
            </View>
        );
    };
});

jest.mock('./ScoreAfter', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function MockScoreAfter({ containerWidth, currentRoundScore, currentRoundTotalScore, fontColor }: {
        containerWidth: number;
        currentRoundScore: number;
        currentRoundTotalScore: number;
        fontColor: string;
    }) {
        const { View, Text } = jest.requireActual('react-native');
        return (
            <View testID="score-after">
                <Text>After: {currentRoundTotalScore}</Text>
                <Text>Color: {fontColor}</Text>
                <Text>Width: {containerWidth}</Text>
            </View>
        );
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

describe('AdditionTile', () => {
    const mockGame = {
        id: 'game-1',
        title: 'Test Game',
        dateCreated: Date.now(),
        roundCurrent: 1,
        roundTotal: 3,
        playerIds: ['player-1'],
    };

    const mockPlayer = {
        id: 'player-1',
        playerName: 'Player One',
        scores: [10, 15, 0], // Total: 25, Current round (1): 15
    };

    const defaultProps = {
        fontColor: '#ffffff',
        maxWidth: 200,
        maxHeight: 150,
        playerId: 'player-1',
        index: 0,
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
                <AdditionTile {...defaultProps} />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render null when player is not found', () => {
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
                entities: {},
                ids: [],
            },
        });

        const { toJSON } = render(
            <Provider store={store}>
                <AdditionTile {...defaultProps} />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render null when maxWidth or maxHeight is null', () => {
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
                entities: {
                    'player-1': mockPlayer,
                },
                ids: ['player-1'],
            },
        });

        const { toJSON: nullWidthJSON } = render(
            <Provider store={store}>
                <AdditionTile {...defaultProps} maxWidth={null} />
            </Provider>
        );

        const { toJSON: nullHeightJSON } = render(
            <Provider store={store}>
                <AdditionTile {...defaultProps} maxHeight={null} />
            </Provider>
        );

        expect(nullWidthJSON()).toBeNull();
        expect(nullHeightJSON()).toBeNull();
    });

    it('should render player name and score components when all props are valid', () => {
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
                entities: {
                    'player-1': mockPlayer,
                },
                ids: ['player-1'],
            },
        });

        const { getByText, getByTestId } = render(
            <Provider store={store}>
                <AdditionTile {...defaultProps} />
            </Provider>
        );

        expect(getByText('Player One')).toBeTruthy();
        expect(getByTestId('score-before')).toBeTruthy();
        expect(getByTestId('score-round')).toBeTruthy();
        expect(getByTestId('score-after')).toBeTruthy();
    });

    it('should calculate correct scores and pass them to sub-components', () => {
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
                entities: {
                    'player-1': mockPlayer,
                },
                ids: ['player-1'],
            },
        });

        const { getByText } = render(
            <Provider store={store}>
                <AdditionTile {...defaultProps} />
            </Provider>
        );

        // Total score up to current round: 10 + 15 = 25
        // Round score: 15
        // Score before current round: 25 - 15 = 10
        expect(getByText('Before: 10')).toBeTruthy();
        expect(getByText('Round: 15')).toBeTruthy();
        expect(getByText('After: 25')).toBeTruthy();
    });

    it('should handle zero round score correctly', () => {
        const playerWithZeroScore = {
            ...mockPlayer,
            scores: [10, 0, 5], // Current round (1) has 0 score
        };

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
                entities: {
                    'player-1': playerWithZeroScore,
                },
                ids: ['player-1'],
            },
        });

        const { getByText } = render(
            <Provider store={store}>
                <AdditionTile {...defaultProps} />
            </Provider>
        );

        expect(getByText('Before: 10')).toBeTruthy();
        expect(getByText('Round: 0')).toBeTruthy();
        expect(getByText('After: 10')).toBeTruthy();
    });

    it('should handle negative scores correctly', () => {
        const playerWithNegativeScore = {
            ...mockPlayer,
            scores: [10, -5, 0], // Current round (1) has -5 score
        };

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
                entities: {
                    'player-1': playerWithNegativeScore,
                },
                ids: ['player-1'],
            },
        });

        const { getByText } = render(
            <Provider store={store}>
                <AdditionTile {...defaultProps} />
            </Provider>
        );

        // Total: 10 + (-5) = 5
        // Before: 5 - (-5) = 10
        expect(getByText('Before: 10')).toBeTruthy();
        expect(getByText('Round: -5')).toBeTruthy();
        expect(getByText('After: 5')).toBeTruthy();
    });

    it('should pass correct container dimensions to sub-components', () => {
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
                entities: {
                    'player-1': mockPlayer,
                },
                ids: ['player-1'],
            },
        });

        const { getAllByText } = render(
            <Provider store={store}>
                <AdditionTile {...defaultProps} maxWidth={300} maxHeight={200} />
            </Provider>
        );

        // Container short edge should be Math.min(300, 200) = 200
        expect(getAllByText('Width: 200')).toHaveLength(3);
    });

    it('should pass font color to all sub-components', () => {
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
                entities: {
                    'player-1': mockPlayer,
                },
                ids: ['player-1'],
            },
        });

        const customColor = '#ff0000';
        const { getAllByText } = render(
            <Provider store={store}>
                <AdditionTile {...defaultProps} fontColor={customColor} />
            </Provider>
        );

        expect(getAllByText(`Color: ${customColor}`)).toHaveLength(3);
    });

    it('should handle different round current values', () => {
        const gameAtRound0 = {
            ...mockGame,
            roundCurrent: 0,
        };

        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': gameAtRound0,
                },
                ids: ['game-1'],
            },
            players: {
                entities: {
                    'player-1': mockPlayer,
                },
                ids: ['player-1'],
            },
        });

        const { getByText } = render(
            <Provider store={store}>
                <AdditionTile {...defaultProps} />
            </Provider>
        );

        // At round 0, total should only include scores up to round 0
        // Total: 10 (only first score)
        // Round score: 10
        // Before: 10 - 10 = 0
        expect(getByText('Before: 0')).toBeTruthy();
        expect(getByText('Round: 10')).toBeTruthy();
        expect(getByText('After: 10')).toBeTruthy();
    });

    it('should handle empty scores array', () => {
        const playerWithNoScores = {
            ...mockPlayer,
            scores: [],
        };

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
                entities: {
                    'player-1': playerWithNoScores,
                },
                ids: ['player-1'],
            },
        });

        // Should not crash and render with zero total
        expect(() => {
            render(
                <Provider store={store}>
                    <AdditionTile {...defaultProps} />
                </Provider>
            );
        }).not.toThrow();
    });

    it('does not re-render when advancing to an empty round keeps displayed score data unchanged', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': {
                        ...mockGame,
                        roundCurrent: 0,
                        roundTotal: 1,
                    },
                },
                ids: ['game-1'],
            },
            players: {
                entities: {
                    'player-1': {
                        ...mockPlayer,
                        scores: [0],
                    },
                },
                ids: ['player-1'],
            },
        });
        const onRender = jest.fn();

        render(
            <Provider store={store}>
                <AdditionTile {...defaultProps} onRender={onRender} />
            </Provider>
        );

        expect(onRender).toHaveBeenCalledTimes(1);
        onRender.mockClear();

        act(() => {
            store.dispatch(roundNext('game-1'));
        });

        expect(onRender).not.toHaveBeenCalled();
    });

    it('re-renders when advancing rounds changes displayed score math', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': {
                        ...mockGame,
                        roundCurrent: 0,
                        roundTotal: 1,
                    },
                },
                ids: ['game-1'],
            },
            players: {
                entities: {
                    'player-1': {
                        ...mockPlayer,
                        scores: [5],
                    },
                },
                ids: ['player-1'],
            },
        });
        const onRender = jest.fn();

        const { getByText } = render(
            <Provider store={store}>
                <AdditionTile {...defaultProps} onRender={onRender} />
            </Provider>
        );

        expect(onRender).toHaveBeenCalledTimes(1);
        onRender.mockClear();

        act(() => {
            store.dispatch(roundNext('game-1'));
        });

        expect(onRender).toHaveBeenCalledTimes(1);
        expect(getByText('Before: 5')).toBeTruthy();
        expect(getByText('Round: 0')).toBeTruthy();
        expect(getByText('After: 5')).toBeTruthy();
    });
});
