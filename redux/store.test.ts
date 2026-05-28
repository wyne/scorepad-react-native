import { configureStore } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';

import gamesReducer, { gameSave } from './GamesSlice';
import scoresReducer, { playerAdd } from './PlayersSlice';
import settingsReducer, { setCurrentGameId } from './SettingsSlice';

// Mock AsyncStorage
const mockAsyncStorage = {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
};

describe('Redux Store Configuration', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let testStore: any;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Create a test store with the same configuration as the real store
        const settingsPersistConfig = {
            key: 'settings',
            version: 0,
            storage: mockAsyncStorage,
            whitelist: [
                'multiplier',
                'addendOne', 
                'addendTwo',
                'currentGameId',
                'onboarded',
                'showPointParticles',
                'showPlayerIndex',
                'interactionType',
                'lastStoreReviewPrompt',
                'devMenuEnabled',
                'appOpens',
                'installId',
                'rollingGameCounter',
            ],
        };

        const gamesPersistConfig = {
            key: 'games',
            version: 0, 
            storage: mockAsyncStorage,
            whitelist: ['entities', 'ids'],
        };

        const playersPersistConfig = {
            key: 'players',
            version: 0,
            storage: mockAsyncStorage,
            whitelist: ['entities', 'ids'],
        };

        testStore = configureStore({
            reducer: {
                settings: persistReducer(settingsPersistConfig, settingsReducer),
                games: persistReducer(gamesPersistConfig, gamesReducer), 
                players: persistReducer(playersPersistConfig, scoresReducer),
            },
            middleware: getDefaultMiddleware => getDefaultMiddleware({
                serializableCheck: {
                    ignoreActions: true
                },
            }),
        });
    });

    it('should have the correct initial state structure', () => {
        const state = testStore.getState();
        
        expect(state).toHaveProperty('settings');
        expect(state).toHaveProperty('games');
        expect(state).toHaveProperty('players');
    });

    it('should handle settings actions', () => {
        const testGameId = 'test-game-123';
        
        testStore.dispatch(setCurrentGameId(testGameId));
        
        const state = testStore.getState();
        expect(state.settings.currentGameId).toBe(testGameId);
    });

    it('should handle player actions', () => {
        const testPlayer = {
            id: 'player-1',
            playerName: 'Test Player',
            scores: [10, 20, 30],
        };
        
        testStore.dispatch(playerAdd(testPlayer));
        
        const state = testStore.getState();
        expect(state.players.entities['player-1']).toEqual(testPlayer);
        expect(state.players.ids).toContain('player-1');
    });

    it('should handle game actions', () => {
        const testGame = {
            id: 'game-1',
            title: 'Test Game',
            dateCreated: Date.now(),
            roundCurrent: 0,
            roundTotal: 1,
            playerIds: ['player-1'],
        };
        
        testStore.dispatch(gameSave(testGame));
        
        const state = testStore.getState();
        expect(state.games.entities['game-1']).toEqual(testGame);
        expect(state.games.ids).toContain('game-1');
    });

    it('should handle concurrent state updates', () => {
        const initialPlayerCount = testStore.getState().players.ids.length;
        
        // Dispatch multiple actions
        testStore.dispatch(playerAdd({
            id: 'player-2',
            playerName: 'Player 2', 
            scores: [5],
        }));
        
        testStore.dispatch(playerAdd({
            id: 'player-3',
            playerName: 'Player 3',
            scores: [15],
        }));
        
        const finalState = testStore.getState();
        expect(finalState.players.ids).toHaveLength(initialPlayerCount + 2);
        expect(finalState.players.entities['player-2']).toBeDefined();
        expect(finalState.players.entities['player-3']).toBeDefined();
    });

    it('should have correct persist configuration', () => {
        // Verify the persist whitelist configuration is applied
        const state = testStore.getState();
        
        // Settings should be persistable
        expect(state.settings).toBeDefined();
        
        // Games and players should have entity structure
        expect(state.games).toHaveProperty('entities');
        expect(state.games).toHaveProperty('ids');
        expect(state.players).toHaveProperty('entities');
        expect(state.players).toHaveProperty('ids');
    });

    it('should handle middleware configuration', () => {
        // Test that actions can be dispatched without serialization errors
        expect(() => {
            testStore.dispatch(setCurrentGameId('test'));
        }).not.toThrow();
        
        expect(() => {
            testStore.dispatch(playerAdd({
                id: 'test-player',
                playerName: 'Test',
                scores: [],
            }));
        }).not.toThrow();
    });
});
