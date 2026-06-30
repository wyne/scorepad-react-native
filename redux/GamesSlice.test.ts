
import { configureStore, EntityState, Store } from '@reduxjs/toolkit';

import gamesReducer, {
    asyncCreateGame,
    asyncRematchGame,
    deleteGameAndPlayers,
    gameSave,
    GameState,
    roundNext,
    roundPrevious,
    selectAllGames
} from './GamesSlice';
import playersReducer, { playerAdd } from './PlayersSlice';
import settingsReducer, { initialState as initialSettings } from './SettingsSlice';

jest.mock('@react-native-firebase/analytics', () => {
    return () => ({
        logEvent: jest.fn(),
    });
});

jest.mock('expo-crypto', () => ({
    randomUUID: jest.fn().mockImplementation(() => {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    })
}));

describe('games reducer', () => {
    let store: Store<EntityState<GameState, string>>;

    beforeEach(() => {
        store = configureStore({
            reducer: gamesReducer, preloadedState: {
                entities: {
                    game1: {
                        id: 'game1',
                        title: 'Game 1',
                        dateCreated: Date.now(),
                        playerIds: [],
                        roundCurrent: 0,
                        roundTotal: 1,
                    },
                },
                ids: ['game1'],
            }
        });
    });

    it('should handle roundNext', () => {
        store.dispatch(roundNext('game1'));

        const state = store.getState();
        if (!state.entities.game1) {
            throw new Error('game1 not found');
        }
        expect(state.entities.game1.roundCurrent).toBe(1);
        expect(state.entities.game1.roundTotal).toBe(2);
    });

    it('should handle roundPrevious', () => {

        store.dispatch(roundPrevious('game1'));

        const state = store.getState();
        if (!state.entities.game1) {
            throw new Error('game1 not found');
        }
        expect(state.entities.game1.roundCurrent).toBe(0);
    });

    it('should handle gameSave', () => {
        const game = {
            id: 'game1',
            title: 'Game 1',
            dateCreated: Date.now(),
            roundCurrent: 0,
            roundTotal: 0,
            playerIds: [],
        };

        store.dispatch(gameSave(game));

        const state = store.getState();
        expect(state.entities.game1).toEqual(game);
        expect(state.ids).toContain('game1');
    });

    it('uses game id as a deterministic tie-breaker for equal creation dates', () => {
        const dateCreated = Date.now();
        store.dispatch(gameSave({
            id: 'z-game',
            title: 'Z Game',
            dateCreated,
            roundCurrent: 0,
            roundTotal: 1,
            playerIds: [],
        }));
        store.dispatch(gameSave({
            id: 'a-game',
            title: 'A Game',
            dateCreated,
            roundCurrent: 0,
            roundTotal: 1,
            playerIds: [],
        }));

        const tiedIds = store.getState().ids.filter(id => id !== 'game1');
        expect(tiedIds).toEqual(['a-game', 'z-game']);
    });

    it('should select all games', () => {
        const initialState = {
            games: {
                entities: {
                    game1: {
                        id: 'game1',
                        title: 'Game 1',
                        dateCreated: Date.now(),
                        roundCurrent: 0,
                        roundTotal: 0,
                        playerIds: [],
                    },
                    game2: {
                        id: 'game2',
                        title: 'Game 2',
                        dateCreated: Date.now(),
                        roundCurrent: 0,
                        roundTotal: 0,
                        playerIds: [],
                    },
                },
                ids: ['game1', 'game2'],
            },
        };

        const games = selectAllGames(initialState);
        expect(games.length).toBe(2);
        expect(games[0].title).toBe('Game 1');
        expect(games[1].title).toBe('Game 2');
    });
});

describe('asyncCreateGame', () => {
    it('dispatches the correct actions with the correct payloads', async () => {
        const store = configureStore({
            reducer: {
                games: gamesReducer,
                players: playersReducer,
            },
        });

        // Define the parameters for asyncCreateGame
        const gameCount = 1;
        const playerCount = 2;

        // Dispatch asyncCreateGame
        await store.dispatch(asyncCreateGame({ gameCount, playerCount }));

        const finalState = store.getState();

        const newGameId: string = finalState.games.ids[0];
        const newGame = finalState.games.entities[newGameId];

        expect(finalState.games.ids.length).toBe(1);
        expect(newGame?.playerIds.length).toBe(2);

        expect(finalState.players.entities[finalState.players.ids[0]]?.scores).toEqual([0]);
        expect(finalState.players.entities[finalState.players.ids[1]]?.scores).toEqual([0]);
    });
});

describe('asyncRematchGame', () => {
    it('dispatches the correct actions with the correct payloads', async () => {
        const store = configureStore({
            reducer: {
                games: gamesReducer,
                players: playersReducer,
            },
        });

        // Define the parameters for asyncCreateGame
        const gameCount = 1;
        const playerCount = 2;

        await store.dispatch(asyncCreateGame({ gameCount, playerCount }));

        const originalGameId: string = store.getState().games.ids[0];

        await store.dispatch(asyncRematchGame({ gameId: originalGameId.toString() }));

        const finalState = store.getState();

        const rematchGameId: string = finalState.games.ids[1];
        const rematchGame = finalState.games.entities[rematchGameId];

        expect(finalState.games.ids.length).toBe(2);
        expect(rematchGame?.playerIds.length).toBe(2);

        expect(finalState.players.entities[finalState.players.ids[2]]?.scores).toEqual([0]);
        expect(finalState.players.entities[finalState.players.ids[3]]?.scores).toEqual([0]);
    });
});

describe('deleteGameAndPlayers', () => {
    it('removes unreferenced players, preserves shared players, and clears the current game', () => {
        const store = configureStore({
            reducer: {
                games: gamesReducer,
                players: playersReducer,
                settings: settingsReducer,
            },
            preloadedState: {
                games: {
                    ids: ['game-1', 'game-2'],
                    entities: {
                        'game-1': {
                            id: 'game-1',
                            title: 'Game 1',
                            dateCreated: 1,
                            roundCurrent: 0,
                            roundTotal: 1,
                            playerIds: ['player-1', 'shared-player'],
                        },
                        'game-2': {
                            id: 'game-2',
                            title: 'Game 2',
                            dateCreated: 2,
                            roundCurrent: 0,
                            roundTotal: 1,
                            playerIds: ['shared-player'],
                        },
                    },
                },
                players: {
                    ids: ['player-1', 'shared-player'],
                    entities: {
                        'player-1': {
                            id: 'player-1',
                            playerName: 'Player 1',
                            scores: [0],
                        },
                        'shared-player': {
                            id: 'shared-player',
                            playerName: 'Shared Player',
                            scores: [0],
                        },
                    },
                },
                settings: {
                    ...initialSettings,
                    currentGameId: 'game-1',
                },
            },
        });

        store.dispatch(deleteGameAndPlayers('game-1'));

        const state = store.getState();
        expect(state.games.entities['game-1']).toBeUndefined();
        expect(state.games.entities['game-2']).toBeDefined();
        expect(state.players.entities['player-1']).toBeUndefined();
        expect(state.players.entities['shared-player']).toBeDefined();
        expect(state.settings.currentGameId).toBeUndefined();
    });

    it('does nothing when the game does not exist', () => {
        const store = configureStore({
            reducer: {
                games: gamesReducer,
                players: playersReducer,
                settings: settingsReducer,
            },
        });
        store.dispatch(playerAdd({
            id: 'player-1',
            playerName: 'Player 1',
            scores: [0],
        }));

        store.dispatch(deleteGameAndPlayers('missing-game'));

        expect(store.getState().players.entities['player-1']).toBeDefined();
    });
});
