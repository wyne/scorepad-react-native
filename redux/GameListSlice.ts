import { GameState } from './CurrentGameSlice';
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { createEntityAdapter } from '@reduxjs/toolkit'

// https://redux.js.org/tutorials/essentials/part-6-performance-normalization#managing-normalized-state-with-createentityadapter

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
    }
})

export const { gameSave } = gamesSlice.actions

export default gamesSlice.reducer

// Export the customized selectors for this adapter using `getSelectors`
export const {
    selectAll: selectAllGames,
    selectById: selectGameById,
    selectIds: selectGameIds
    // Pass in a selector that returns the posts slice of state
} = gamesAdapter.getSelectors(state => state.games)
