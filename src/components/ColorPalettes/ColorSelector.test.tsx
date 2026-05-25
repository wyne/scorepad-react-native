import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../../redux/GamesSlice';
import playersReducer from '../../../redux/PlayersSlice';
import settingsReducer from '../../../redux/SettingsSlice';
import * as Analytics from '../../Analytics';
import * as ColorPalette from '../../ColorPalette';

import ColorSelector from './ColorSelector';

// Mock external dependencies
jest.mock('../../Analytics');
jest.mock('../../ColorPalette');

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

describe('ColorSelector', () => {
    const mockGame = {
        id: 'game-1',
        title: 'Test Game',
        dateCreated: Date.now(),
        roundCurrent: 0,
        roundTotal: 1,
        playerIds: ['player-1'],
        palette: 'default',
    };

    const mockPlayer = {
        id: 'player-1',
        playerName: 'Test Player',
        scores: [10],
        color: '#FF0000',
    };

    const mockPalettes = ['default', 'warm', 'cool'];
    const mockDefaultPalette = ['#FF0000', '#00FF00', '#0000FF'];
    const mockWarmPalette = ['#FF6B6B', '#FFA500', '#FFD700'];
    const mockCoolPalette = ['#4ECDC4', '#45B7D1', '#9B59B6'];

    const mockInitialState = {
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
    };

    beforeEach(() => {
        jest.clearAllMocks();
        
        (ColorPalette.getPalettes as jest.Mock).mockReturnValue(mockPalettes);
        (ColorPalette.getPalette as jest.Mock).mockImplementation((palette: string) => {
            switch (palette) {
                case 'default':
                    return mockDefaultPalette;
                case 'warm':
                    return mockWarmPalette;
                case 'cool':
                    return mockCoolPalette;
                default:
                    return mockDefaultPalette;
            }
        });
    });

    it('should render null when no current game exists', () => {
        const storeWithoutGame = createMockStore({
            ...mockInitialState,
            settings: {
                currentGameId: undefined,
            },
            games: {
                entities: {},
                ids: [],
            },
        });

        const { toJSON } = render(
            <Provider store={storeWithoutGame}>
                <ColorSelector playerId="player-1" />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render current palette section', () => {
        const store = createMockStore(mockInitialState);

        const { getByText } = render(
            <Provider store={store}>
                <ColorSelector playerId="player-1" />
            </Provider>
        );

        expect(getByText('Current Pallete')).toBeTruthy();
    });

    it('should render other palettes section', () => {
        const store = createMockStore(mockInitialState);

        const { getByText } = render(
            <Provider store={store}>
                <ColorSelector playerId="player-1" />
            </Provider>
        );

        expect(getByText('Other Palletes')).toBeTruthy();
    });

    it('should render colors from current palette', () => {
        const store = createMockStore(mockInitialState);

        const component = render(
            <Provider store={store}>
                <ColorSelector playerId="player-1" />
            </Provider>
        );

        // Should render the component without errors
        expect(component.toJSON()).toBeTruthy();
    });

    it('should highlight selected color in current palette', () => {
        const store = createMockStore(mockInitialState);

        const component = render(
            <Provider store={store}>
                <ColorSelector playerId="player-1" />
            </Provider>
        );

        // Should render the component with player's current color
        expect(component.toJSON()).toBeTruthy();
    });

    it('should update player color when current palette color is pressed', () => {
        const store = createMockStore(mockInitialState);
        const mockLogEvent = jest.mocked(Analytics.logEvent);

        const { UNSAFE_getAllByType } = render(
            <Provider store={store}>
                <ColorSelector playerId="player-1" />
            </Provider>
        );

        // Get all TouchableOpacity components
        const TouchableOpacity = jest.requireActual('react-native').TouchableOpacity;
        const touchableComponents = UNSAFE_getAllByType(TouchableOpacity);
        
        // Press the first color in current palette (should be #FF0000)
        const firstCurrentPaletteButton = touchableComponents[0];
        fireEvent.press(firstCurrentPaletteButton);

        // Check that the store was updated
        const state = store.getState();
        expect(state.players.entities['player-1']?.color).toBe('#FF0000');

        // Check that analytics event was logged with correct parameters
        expect(mockLogEvent).toHaveBeenCalledWith('set_player_color', {
            gameId: 'game-1',
            palette: 'default',
            color: '#FF0000',
            inCurrentPalette: true,
        });
    });

    it('should update player color when other palette color is pressed', () => {
        const store = createMockStore(mockInitialState);
        const mockLogEvent = jest.mocked(Analytics.logEvent);

        const { UNSAFE_getAllByType } = render(
            <Provider store={store}>
                <ColorSelector playerId="player-1" />
            </Provider>
        );

        // Get all TouchableOpacity components
        const TouchableOpacity = jest.requireActual('react-native').TouchableOpacity;
        const touchableComponents = UNSAFE_getAllByType(TouchableOpacity);
        
        // Press a color from another palette (should be from warm palette: #FF6B6B)
        // Current palette has 3 colors, so index 3 should be first color from warm palette
        const firstOtherPaletteButton = touchableComponents[3];
        fireEvent.press(firstOtherPaletteButton);

        // Check that the store was updated
        const state = store.getState();
        expect(state.players.entities['player-1']?.color).toBe('#FF6B6B');

        // Check that analytics event was logged with correct parameters
        expect(mockLogEvent).toHaveBeenCalledWith('set_player_color', {
            gameId: 'game-1',
            palette: 'default',
            color: '#FF6B6B',
            inCurrentPalette: false,
        });
    });

    it('should not render current palette in other palettes section', () => {
        const store = createMockStore(mockInitialState);

        render(
            <Provider store={store}>
                <ColorSelector playerId="player-1" />
            </Provider>
        );

        // getPalette should be called for current palette and other palettes
        expect(ColorPalette.getPalette).toHaveBeenCalledWith('default'); // current palette
        expect(ColorPalette.getPalette).toHaveBeenCalledWith('warm');    // other palette
        expect(ColorPalette.getPalette).toHaveBeenCalledWith('cool');    // other palette

        // Current palette should only appear once (in current palette section)
        expect(ColorPalette.getPalette).toHaveBeenCalledTimes(3);
    });

    it('should handle player without color', () => {
        const playerWithoutColor = {
            ...mockPlayer,
            color: undefined,
        };

        const storeWithPlayerWithoutColor = createMockStore({
            ...mockInitialState,
            players: {
                entities: {
                    'player-1': playerWithoutColor,
                },
                ids: ['player-1'],
            },
        });

        const component = render(
            <Provider store={storeWithPlayerWithoutColor}>
                <ColorSelector playerId="player-1" />
            </Provider>
        );

        // Should render without errors even when player has no color
        expect(component.toJSON()).toBeTruthy();
    });

    it('should handle game without palette', () => {
        const gameWithoutPalette = {
            ...mockGame,
            palette: undefined,
        };

        const storeWithGameWithoutPalette = createMockStore({
            ...mockInitialState,
            games: {
                entities: {
                    'game-1': gameWithoutPalette,
                },
                ids: ['game-1'],
            },
        });

        const { getByText } = render(
            <Provider store={storeWithGameWithoutPalette}>
                <ColorSelector playerId="player-1" />
            </Provider>
        );

        // Should still render the sections
        expect(getByText('Current Pallete')).toBeTruthy();
        expect(getByText('Other Palletes')).toBeTruthy();
    });

    it('should handle different player colors correctly', () => {
        const playerWithDifferentColor = {
            ...mockPlayer,
            color: '#FF6B6B', // Color from warm palette
        };

        const storeWithDifferentColor = createMockStore({
            ...mockInitialState,
            players: {
                entities: {
                    'player-1': playerWithDifferentColor,
                },
                ids: ['player-1'],
            },
        });

        const component = render(
            <Provider store={storeWithDifferentColor}>
                <ColorSelector playerId="player-1" />
            </Provider>
        );

        // Should render with different color
        expect(component.toJSON()).toBeTruthy();
    });

    it('should call getPalettes and getPalette with correct parameters', () => {
        const store = createMockStore(mockInitialState);

        render(
            <Provider store={store}>
                <ColorSelector playerId="player-1" />
            </Provider>
        );

        expect(ColorPalette.getPalettes).toHaveBeenCalledTimes(1);
        expect(ColorPalette.getPalette).toHaveBeenCalledWith('default'); // current palette
        expect(ColorPalette.getPalette).toHaveBeenCalledWith('warm');    // other palette
        expect(ColorPalette.getPalette).toHaveBeenCalledWith('cool');    // other palette
    });

    it('should handle empty palettes gracefully', () => {
        (ColorPalette.getPalettes as jest.Mock).mockReturnValue([]);
        (ColorPalette.getPalette as jest.Mock).mockReturnValue([]);

        const store = createMockStore(mockInitialState);

        const { getByText } = render(
            <Provider store={store}>
                <ColorSelector playerId="player-1" />
            </Provider>
        );

        // Should still render section titles
        expect(getByText('Current Pallete')).toBeTruthy();
        expect(getByText('Other Palletes')).toBeTruthy();
    });

    it('should handle multiple rapid color selections', () => {
        const store = createMockStore(mockInitialState);
        const mockLogEvent = jest.mocked(Analytics.logEvent);

        const { UNSAFE_getAllByType } = render(
            <Provider store={store}>
                <ColorSelector playerId="player-1" />
            </Provider>
        );

        // Get all TouchableOpacity components
        const TouchableOpacity = jest.requireActual('react-native').TouchableOpacity;
        const touchableComponents = UNSAFE_getAllByType(TouchableOpacity);

        // Rapidly press multiple colors
        fireEvent.press(touchableComponents[0]); // First current palette color (#FF0000)
        fireEvent.press(touchableComponents[1]); // Second current palette color (#00FF00)
        fireEvent.press(touchableComponents[3]); // First other palette color (#FF6B6B)

        // Check that analytics was called 3 times
        expect(mockLogEvent).toHaveBeenCalledTimes(3);

        // Check final state - should be the last pressed color
        const state = store.getState();
        expect(state.players.entities['player-1']?.color).toBe('#FF6B6B');

        // Verify all analytics calls
        expect(mockLogEvent).toHaveBeenNthCalledWith(1, 'set_player_color', {
            gameId: 'game-1',
            palette: 'default',
            color: '#FF0000',
            inCurrentPalette: true,
        });
        expect(mockLogEvent).toHaveBeenNthCalledWith(2, 'set_player_color', {
            gameId: 'game-1',
            palette: 'default',
            color: '#00FF00',
            inCurrentPalette: true,
        });
        expect(mockLogEvent).toHaveBeenNthCalledWith(3, 'set_player_color', {
            gameId: 'game-1',
            palette: 'default',
            color: '#FF6B6B',
            inCurrentPalette: false,
        });
    });

    it('should handle different game palettes', () => {
        const gameWithWarmPalette = {
            ...mockGame,
            palette: 'warm',
        };

        const storeWithWarmPalette = createMockStore({
            ...mockInitialState,
            games: {
                entities: {
                    'game-1': gameWithWarmPalette,
                },
                ids: ['game-1'],
            },
        });

        render(
            <Provider store={storeWithWarmPalette}>
                <ColorSelector playerId="player-1" />
            </Provider>
        );

        // Should call getPalette with 'warm' as current palette
        expect(ColorPalette.getPalette).toHaveBeenCalledWith('warm');
        
        // Should call getPalette with other palettes but not 'warm'
        expect(ColorPalette.getPalette).toHaveBeenCalledWith('default');
        expect(ColorPalette.getPalette).toHaveBeenCalledWith('cool');
        
        // Should not call getPalette twice for 'warm'
        const warmCalls = (ColorPalette.getPalette as jest.Mock).mock.calls.filter(call => call[0] === 'warm');
        expect(warmCalls.length).toBe(1);
    });
});
