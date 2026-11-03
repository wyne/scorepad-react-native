import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';
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
jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: ({ children }: { children: React.ReactNode }) => {
        const { View } = jest.requireActual('react-native');
        return <View>{children}</View>;
    },
    useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 34, left: 0, right: 0 })),
}));
jest.mock('expo-font', () => ({
    isLoaded: () => true,
    loadAsync: () => Promise.resolve(),
}));

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

    const renderWithGame = (game = mockGame) => {
        const store = createMockStore({
            settings: { currentGameId: 'game-1' },
            games: { entities: { 'game-1': game }, ids: ['game-1'] },
            players: { entities: mockPlayers, ids: ['player-1', 'player-2'] },
        });
        return render(
            <Provider store={store}>
                <ShareScreen navigation={mockNavigation} />
            </Provider>
        );
    };

    it('previews the scoreboard with standings, leader and rounds', () => {
        const { getByText, getAllByText, getByTestId } = renderWithGame();

        expect(getByText('Test Game')).toBeTruthy();
        expect(getByText(/3 rounds · 2 players/)).toBeTruthy();
        expect(getByText('Player 2 leads with 50')).toBeTruthy();
        expect(getByText('+5')).toBeTruthy();
        expect(getAllByText('Player 1').length).toBeGreaterThan(0);
        expect(getByTestId('share-scoreboard')).toBeTruthy();
        expect(getByTestId('share-round-0')).toBeTruthy();
        expect(getByTestId('share-round-2')).toBeTruthy();
    });

    it('leaves space below the content for the share buttons', () => {
        const { getByTestId } = renderWithGame();

        expect(getByTestId('share-screen-scroll').props.contentContainerStyle).toEqual({
            paddingBottom: 130,
        });
    });

    it('hides round columns and details when toggled off', () => {
        const { getByTestId, queryByTestId, queryByText } = renderWithGame();

        fireEvent.press(getByTestId('share-toggle-rounds'));
        fireEvent.press(getByTestId('share-toggle-details'));

        expect(queryByTestId('share-round-0')).toBeNull();
        expect(queryByText(/3 rounds · 2 players/)).toBeNull();
    });

    it('switches between formats', () => {
        const { getByTestId, queryByTestId, getByText } = renderWithGame();

        fireEvent.press(getByTestId('share-format-standings'));
        expect(getByTestId('share-standings')).toBeTruthy();
        expect(queryByTestId('share-scoreboard')).toBeNull();

        fireEvent.press(getByTestId('share-format-winner'));
        expect(getByText('by 5 points')).toBeTruthy();
    });

    it('keeps the controls above the scrolling preview', () => {
        const { getByTestId } = renderWithGame();

        const scroll = getByTestId('share-screen-scroll');
        expect(scroll.findAll(node => node.props.testID === 'share-format-scoreboard')).toHaveLength(0);
        expect(scroll.findAll(node => node.props.testID === 'share-preview').length).toBeGreaterThan(0);
    });

    it('opens the editor from the edit chip', () => {
        const { getByTestId } = renderWithGame();

        fireEvent.press(getByTestId('share-edit'));

        expect(mockNavigation.navigate).toHaveBeenCalledWith('EditGame', { source: 'share_screen' });
    });

    it('captures and shares the card as an image', async () => {
        const mockCaptureRef = jest.mocked(captureRef);
        const mockShareAsync = jest.mocked(Sharing.shareAsync);
        const mockLogEvent = jest.mocked(Analytics.logEvent);
        mockCaptureRef.mockResolvedValue('file://test-image.png');
        mockShareAsync.mockResolvedValue(undefined);
        mockLogEvent.mockResolvedValue();

        const { getByText } = renderWithGame();
        fireEvent.press(getByText('Share Image'));

        await waitFor(() => {
            expect(mockCaptureRef).toHaveBeenCalledWith(expect.anything(), {
                result: 'tmpfile',
                quality: 1,
                format: 'png',
                fileName: undefined,
            });
        });
        await waitFor(() => {
            expect(mockShareAsync).toHaveBeenCalledWith('file://test-image.png', {
                mimeType: 'image/png',
                dialogTitle: 'Share Scoreboard',
                UTI: 'image/png',
            });
        });
        expect(mockLogEvent).toHaveBeenCalledWith('share_image', {
            format: 'scoreboard', rounds_shown: true, details_shown: true,
        });
    });

    it('does not log a share when capturing fails', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.mocked(captureRef).mockRejectedValue(new Error('nope'));

        const { getByText } = renderWithGame();
        fireEvent.press(getByText('Share Image'));

        await waitFor(() => expect(errorSpy).toHaveBeenCalled());
        expect(Analytics.logEvent).not.toHaveBeenCalled();
        errorSpy.mockRestore();
    });

    it('shares the scoreboard as text', async () => {
        const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction', activityType: undefined });

        const { getByText } = renderWithGame();
        fireEvent.press(getByText('Share Text'));

        await waitFor(() => expect(shareSpy).toHaveBeenCalled());
        const message = shareSpy.mock.calls[0][0] as { message: string };
        expect(message.message).toContain('1. Player 2 – 50');
        expect(message.message).toContain('Rounds');
        await waitFor(() => {
            expect(Analytics.logEvent).toHaveBeenCalledWith('share_text', { rounds_shown: true, details_shown: true });
        });
    });

    it('handles a game with zero rounds', () => {
        const { getByText, queryByTestId } = renderWithGame({ ...mockGame, roundTotal: 0 });

        expect(getByText('Test Game')).toBeTruthy();
        expect(queryByTestId('share-round-0')).toBeNull();
    });
});
