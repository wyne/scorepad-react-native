import { configureStore } from '@reduxjs/toolkit';
import { EntityState } from '@reduxjs/toolkit';
import { Store } from 'redux';

import gamesReducer, {
    roundNext,
    roundPrevious,
    gameSave,
    gameDelete,
    selectAllGames,
} from './GamesSlice';
import { GameState } from './GamesSlice';

describe('games reducer', () => {
    let store: Store<EntityState<GameState>>;

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

    it('should handle gameDelete', () => {
        store.dispatch(gameDelete('game1'));

        const state = store.getState();
        expect(state.entities.game1).toBeUndefined();
        expect(state.ids).not.toContain('game1');
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
