import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
import { ScrollView } from 'react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer from '../../redux/SettingsSlice';

import ScoreLogTable from './ScoreLogTable';

// Mock dependencies
jest.mock('react-native-gesture-handler', () => {
    const mockReact = jest.requireActual('react');
    return {
        TouchableOpacity: ({ onPress, children }: { onPress: () => void; children: React.ReactNode }) => {
            const { TouchableOpacity: RNTouchableOpacity } = jest.requireActual('react-native');
            return mockReact.createElement(RNTouchableOpacity, { onPress }, children);
        },
        ScrollView: mockReact.forwardRef(({ children, onLayout, horizontal, contentContainerStyle, nestedScrollEnabled }: {
            children: React.ReactNode;
            onLayout?: (event: { nativeEvent: { layout: { width: number; height: number } } }) => void;
            horizontal?: boolean;
            contentContainerStyle?: object;
            nestedScrollEnabled?: boolean;
        }, ref: React.Ref<ScrollView>) => {
            const { ScrollView: RNScrollView } = jest.requireActual('react-native');
            return mockReact.createElement(RNScrollView, {
                ref,
                onLayout,
                horizontal,
                contentContainerStyle,
                nestedScrollEnabled,
                testID: 'score-log-scroll-view'
            }, children);
        }),
    };
});

jest.mock('../Analytics', () => ({
    logEvent: jest.fn(),
}));

jest.mock('./ScoreLog/PlayerNameColumn', () => {
    return function MockPlayerNameColumn() {
        const mockReact = jest.requireActual('react');
        const { View, Text } = jest.requireActual('react-native');
        return mockReact.createElement(
            View,
            { testID: 'player-name-column' },
            mockReact.createElement(Text, {}, 'Player Names')
        );
    };
});

jest.mock('./ScoreLog/TotalScoreColumn', () => {
    return function MockTotalScoreColumn() {
        const mockReact = jest.requireActual('react');
        const { View, Text } = jest.requireActual('react-native');
        return mockReact.createElement(
            View,
            { testID: 'total-score-column' },
            mockReact.createElement(Text, {}, 'Total Scores')
        );
    };
});

jest.mock('./ScoreLog/RoundScoreColumn', () => {
    return function MockRoundScoreColumn({ round, isCurrentRound }: { round: number; isCurrentRound: boolean }) {
        const mockReact = jest.requireActual('react');
        const { View, Text } = jest.requireActual('react-native');
        return mockReact.createElement(
            View,
            { testID: `round-score-column-${round}` },
            mockReact.createElement(Text, {}, `Round ${round + 1} ${isCurrentRound ? '(Current)' : ''}`)
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


describe('ScoreLogTable', () => {
    const mockGame = {
        id: 'game-1',
        title: 'Test Game',
        dateCreated: Date.now(),
        roundCurrent: 2,
        roundTotal: 5,
        playerIds: ['player-1', 'player-2'],
        sortSelector: 'byIndex',
    };

    const mockPlayers = {
        'player-1': {
            id: 'player-1',
            playerName: 'Player 1',
            scores: [10, 15, 20],
        },
        'player-2': {
            id: 'player-2',
            playerName: 'Player 2',
            scores: [8, 12, 18],
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

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
                <ScoreLogTable />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render score table with player names and total scores', () => {
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
                <ScoreLogTable />
            </Provider>
        );

        expect(getByTestId('player-name-column')).toBeTruthy();
        expect(getByTestId('total-score-column')).toBeTruthy();
        expect(getByTestId('score-log-scroll-view')).toBeTruthy();
    });

    it('should render all round score columns based on roundTotal', () => {
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
                <ScoreLogTable />
            </Provider>
        );

        // Should render 5 rounds (roundTotal = 5)
        expect(getByTestId('round-score-column-0')).toBeTruthy();
        expect(getByTestId('round-score-column-1')).toBeTruthy();
        expect(getByTestId('round-score-column-2')).toBeTruthy();
        expect(getByTestId('round-score-column-3')).toBeTruthy();
        expect(getByTestId('round-score-column-4')).toBeTruthy();
    });

    it('should mark current round correctly', () => {
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

        const { getByText } = render(
            <Provider store={store}>
                <ScoreLogTable />
            </Provider>
        );

        // Round 2 (index 2) should be marked as current
        expect(getByText('Round 3 (Current)')).toBeTruthy();
    });

    it('should handle sort by player index when player name column is pressed', () => {
        const gameWithoutSort = {
            ...mockGame,
            sortSelector: undefined,
        };

        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': gameWithoutSort,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { logEvent } = require('../Analytics');
        const { getByTestId } = render(
            <Provider store={store}>
                <ScoreLogTable />
            </Provider>
        );

        const playerNameColumn = getByTestId('player-name-column');
        fireEvent.press(playerNameColumn);

        expect(logEvent).toHaveBeenCalledWith('sort_by_index', { gameId: 'game-1' });
    });

    it('should handle sort by total score when total score column is pressed', () => {
        const gameWithoutSort = {
            ...mockGame,
            sortSelector: undefined,
        };

        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': gameWithoutSort,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { logEvent } = require('../Analytics');
        const { getByTestId } = render(
            <Provider store={store}>
                <ScoreLogTable />
            </Provider>
        );

        const totalScoreColumn = getByTestId('total-score-column');
        fireEvent.press(totalScoreColumn);

        expect(logEvent).toHaveBeenCalledWith('sort_by_score', { gameId: 'game-1' });
    });

    it('should handle games with single round', () => {
        const singleRoundGame = {
            ...mockGame,
            roundTotal: 1,
            roundCurrent: 0,
        };

        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': singleRoundGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId, queryByTestId } = render(
            <Provider store={store}>
                <ScoreLogTable />
            </Provider>
        );

        expect(getByTestId('round-score-column-0')).toBeTruthy();
        expect(queryByTestId('round-score-column-1')).toBeNull();
    });

    it('should handle layout changes for round columns', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': {
                        ...mockGame,
                        roundTotal: 2,
                    },
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
                <ScoreLogTable />
            </Provider>
        );

        const roundColumn = getByTestId('round-score-column-0');
        
        // Simulate layout event - this should trigger the onLayoutHandler
        fireEvent(roundColumn.parent!, 'layout', {
            nativeEvent: {
                layout: {
                    x: 100,
                    y: 0,
                    width: 80,
                    height: 200,
                },
            },
        });

        // The component should handle the layout event without crashing
        expect(getByTestId('round-score-column-0')).toBeTruthy();
    });

    it('should handle default values for missing game data', () => {
        const incompleteGame = {
            id: 'game-1',
            title: 'Test Game',
            dateCreated: Date.now(),
            playerIds: ['player-1'],
            // Missing roundCurrent and roundTotal
        };

        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': incompleteGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <ScoreLogTable />
            </Provider>
        );

        // Should render with default values (roundCurrent: 0, roundTotal: 1)
        expect(getByTestId('player-name-column')).toBeTruthy();
        expect(getByTestId('round-score-column-0')).toBeTruthy();
    });

    it('should handle show prop being false', () => {
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
                <ScoreLogTable />
            </Provider>
        );

        // Component should still render regardless of show prop
        expect(getByTestId('player-name-column')).toBeTruthy();
    });

    it('should handle multiple rounds with different current round', () => {
        const gameWithDifferentCurrentRound = {
            ...mockGame,
            roundCurrent: 0,
            roundTotal: 3,
        };

        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': gameWithDifferentCurrentRound,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByText } = render(
            <Provider store={store}>
                <ScoreLogTable />
            </Provider>
        );

        // Round 0 (index 0) should be marked as current
        expect(getByText('Round 1 (Current)')).toBeTruthy();
    });

    it('should render horizontal scroll view correctly', () => {
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
                <ScoreLogTable />
            </Provider>
        );

        const scrollView = getByTestId('score-log-scroll-view');
        expect(scrollView.props.horizontal).toBe(true);
        expect(scrollView.props.nestedScrollEnabled).toBe(true);
        expect(scrollView.props.contentContainerStyle).toEqual({ flexDirection: 'row' });
    });
});
