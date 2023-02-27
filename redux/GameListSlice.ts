import { GameState } from './CurrentGameSlice';
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { createEntityAdapter } from '@reduxjs/toolkit'

// https://redux.js.org/tutorials/essentials/part-6-performance-normalization#managing-normalized-state-with-createentityadapter
/*
// Future normalized state
{
    entities: {
        games: { 
            byId: {
                'game1': {
                    dateCreated: 123456789,
                    scores: ['score1', 'score2'],
                    roundCurrent: 0,
                    roundTotal: 3,
                }
            }, 
            allIds: ['game1']
        },
        scores: {
            byId:{
                'score1': {
                    player: 'player1',
                    scores: [5, 11, 14],
                },
                'score2': {
                    player: 'player2',
                    scores: [5, 10, 15],
                }
            },
            allIds: ['score1', 'score2']
        },
        players: { 
            byId: {
                'player1': {
                    name: 'Player 1',
                },
                'player2': {
                    name: 'Player 2',
                }
            },
            allIds: ['player1', 'player2']
        },
    },
    ui: {
        gameFullscreen: false,
        multiplier: 1,
    }
}
*/

const gamesAdapter = createEntityAdapter({
    selectId: (game: GameState) => game.uuid,
    sortComparer: (a: GameState, b: GameState) => (a.dateCreated < b.dateCreated) ? 1 : -1,
})

const initialState = gamesAdapter.getInitialState({
    status: 'idle',
    error: null
})

const gamesSlice = createSlice({
    name: 'games',
    initialState,
    reducers: {
        gameSave(state, action: PayloadAction<GameState>) {
            gamesAdapter.upsertOne(state, action.payload);
        },
        gameDelete(state, action: PayloadAction<string>) {
            gamesAdapter.removeOne(state, action.payload);
        }
    }
})

export const { gameSave, gameDelete } = gamesSlice.actions

export default gamesSlice.reducer

// Export the customized selectors for this adapter using `getSelectors`
export const {
    selectAll: selectAllGames,
    selectById: selectGameById,
    selectIds: selectGameIds
    // Pass in a selector that returns the posts slice of state
} = gamesAdapter.getSelectors(state => state.games)
