import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer from '../../redux/SettingsSlice';
import * as Analytics from '../Analytics';

import ShareScreen from './ShareScreen';

// Mock external dependencies
jest.mock('expo-sharing');
jest.mock('react-native-view-shot');
jest.mock('../Analytics');
jest.mock('expo-font', () => ({
    isLoaded: () => true,
    loadAsync: () => Promise.resolve(),
}));

// Mock the components that ShareScreen uses
jest.mock('../components/ScoreLog/PlayerNameColumn', () => {
    return function MockPlayerNameColumn() {
        const { View, Text } = jest.requireActual('react-native');
        return <View testID="player-name-column"><Text>PlayerNameColumn</Text></View>;
    };
});

jest.mock('../components/ScoreLog/RoundScoreColumn', () => {
    return function MockRoundScoreColumn({ round, isCurrentRound, disabled }: { round: number; isCurrentRound: boolean; disabled: boolean }) {
        const { View, Text } = jest.requireActual('react-native');
        return (
            <View testID={`round-score-column-${round}`}>
                <Text>Round {round} - Current: {isCurrentRound.toString()} - Disabled: {disabled.toString()}</Text>
            </View>
        );
    };
});

jest.mock('../components/ScoreLog/TotalScoreColumn', () => {
    return function MockTotalScoreColumn() {
        const { View, Text } = jest.requireActual('react-native');
        return <View testID="total-score-column"><Text>TotalScoreColumn</Text></View>;
    };
});

// Mock navigation
const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => true),
    getId: jest.fn(),
    getParent: jest.fn(),
    getState: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    popToTop: jest.fn(),
    replace: jest.fn(),
    jumpTo: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

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

describe('ShareScreen', () => {
    const mockGame = {
        id: 'game-1',
        title: 'Test Game',
        dateCreated: 1609459200000, // January 1, 2021
        roundCurrent: 0,
        roundTotal: 3,
        playerIds: ['player-1', 'player-2'],
    };

    const mockPlayers = {
        'player-1': {
            id: 'player-1',
            playerName: 'Player 1',
            scores: [10, 20, 15],
        },
        'player-2': {
            id: 'player-2',
            playerName: 'Player 2',
            scores: [15, 25, 10],
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
                <ShareScreen navigation={mockNavigation} />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render null when current game does not exist', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'nonexistent-game',
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
                <ShareScreen navigation={mockNavigation} />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render share screen with game data when current game exists', () => {
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

        const { getByText, getByTestId } = render(
            <Provider store={store}>
                <ShareScreen navigation={mockNavigation} />
            </Provider>
        );

        // Check that game title is displayed
        expect(getByText('Test Game')).toBeTruthy();
        
        // Check that creation date is displayed
        expect(getByText(/Created:/)).toBeTruthy();
        
        // Check that instructions text is displayed
        expect(getByText(/You can edit the game title or player names before sharing/)).toBeTruthy();
        
        // Check that edit button is displayed
        expect(getByText(' Edit before sharing')).toBeTruthy();
        
        // Check that share button is displayed
        expect(getByText(' Share as image...')).toBeTruthy();
        
        // Check that score columns are rendered
        expect(getByTestId('player-name-column')).toBeTruthy();
        expect(getByTestId('total-score-column')).toBeTruthy();
    });

    it('should render correct number of round columns based on roundTotal', () => {
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
                <ShareScreen navigation={mockNavigation} />
            </Provider>
        );

        // Should render 3 round columns (roundTotal = 3)
        expect(getByTestId('round-score-column-0')).toBeTruthy();
        expect(getByTestId('round-score-column-1')).toBeTruthy();
        expect(getByTestId('round-score-column-2')).toBeTruthy();
    });

    it('should navigate to Settings screen when edit button is pressed', () => {
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
                <ShareScreen navigation={mockNavigation} />
            </Provider>
        );

        const editButton = getByText(' Edit before sharing');
        fireEvent.press(editButton);

        expect(mockNavigation.navigate).toHaveBeenCalledWith('Settings', { source: 'share_screen' });
    });

    it('should capture and share image when share button is pressed', async () => {
        const mockCaptureRef = jest.mocked(captureRef);
        const mockShareAsync = jest.mocked(Sharing.shareAsync);
        const mockLogEvent = jest.mocked(Analytics.logEvent);

        const mockUri = 'file://test-image.png';
        mockCaptureRef.mockResolvedValue(mockUri);
        mockShareAsync.mockResolvedValue(undefined);
        mockLogEvent.mockResolvedValue();

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
                <ShareScreen navigation={mockNavigation} />
            </Provider>
        );

        const shareButton = getByText(' Share as image...');
        fireEvent.press(shareButton);

        await waitFor(() => {
            expect(mockCaptureRef).toHaveBeenCalledWith(
                expect.anything(),
                {
                    result: 'tmpfile',
                    quality: 1,
                    format: 'png',
                    snapshotContentContainer: true,
                }
            );
        });

        await waitFor(() => {
            expect(mockShareAsync).toHaveBeenCalledWith(
                mockUri,
                {
                    mimeType: 'image/png',
                    dialogTitle: 'Share Scoreboard',
                    UTI: 'image/png',
                }
            );
        });

        await waitFor(() => {
            expect(mockLogEvent).toHaveBeenCalledWith('share_image');
        });
    });

    it('should handle captureRef errors gracefully', async () => {
        const mockLogEvent = jest.mocked(Analytics.logEvent);
        mockLogEvent.mockResolvedValue();

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
                <ShareScreen navigation={mockNavigation} />
            </Provider>
        );

        const shareButton = getByText(' Share as image...');
        fireEvent.press(shareButton);

        // Should handle errors gracefully
        await waitFor(() => {
            expect(mockLogEvent).toHaveBeenCalledWith('share_image');
        });
    });

    it('should handle game with zero rounds', () => {
        const gameWithNoRounds = {
            ...mockGame,
            roundTotal: 0,
        };

        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': gameWithNoRounds,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByText, getByTestId, queryByTestId } = render(
            <Provider store={store}>
                <ShareScreen navigation={mockNavigation} />
            </Provider>
        );

        // Should still render the basic components
        expect(getByText('Test Game')).toBeTruthy();
        expect(getByTestId('player-name-column')).toBeTruthy();
        expect(getByTestId('total-score-column')).toBeTruthy();
        
        // Should not render any round columns
        expect(queryByTestId('round-score-column-0')).toBeNull();
    });

    it('should format date correctly in the display', () => {
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
                <ShareScreen navigation={mockNavigation} />
            </Provider>
        );

        // The date should be formatted using toLocaleDateString and toLocaleTimeString
        const expectedDate = new Date(mockGame.dateCreated).toLocaleDateString();
        const expectedTime = new Date(mockGame.dateCreated).toLocaleTimeString();
        
        expect(getByText(new RegExp(expectedDate))).toBeTruthy();
        expect(getByText(new RegExp(expectedTime))).toBeTruthy();
    });

    it('should pass correct props to RoundScoreColumn components', () => {
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
                <ShareScreen navigation={mockNavigation} />
            </Provider>
        );

        // Check that RoundScoreColumn components receive correct props
        expect(getByText('Round 0 - Current: false - Disabled: true')).toBeTruthy();
        expect(getByText('Round 1 - Current: false - Disabled: true')).toBeTruthy();
        expect(getByText('Round 2 - Current: false - Disabled: true')).toBeTruthy();
    });
});
