import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { createEntityAdapter } from '@reduxjs/toolkit'

interface GameState {
    id: string;
    title: string;
    dateCreated: number;
    roundCurrent: number;
    roundTotal: number;
    playerIds: string[];
}

const gamesAdapter = createEntityAdapter({
    // selectId: (game: GameState) => game.uuid,
    sortComparer: (a: GameState, b: GameState) => (a.dateCreated < b.dateCreated) ? 1 : -1,
})

const initialState = gamesAdapter.getInitialState({
})

const gamesSlice = createSlice({
    name: 'games',
    initialState,
    reducers: {
        updateGame: gamesAdapter.updateOne,
        roundNext(state, action: PayloadAction<GameState>) {
            gamesAdapter.updateOne(state, {
                id: action.payload.id,
                changes: {
                    roundCurrent: action.payload.roundCurrent + 1,
                    roundTotal: Math.max(action.payload.roundTotal, action.payload.roundCurrent + 1)
                }
            })
        },
        roundPrevious(state, action: PayloadAction<GameState>) {
            gamesAdapter.updateOne(state, {
                id: action.payload.id,
                changes: {
                    roundCurrent: Math.max(0, action.payload.roundCurrent - 1),
                }
            })
        },
        gameSave(state, action: PayloadAction<GameState>) {
            gamesAdapter.upsertOne(state, action.payload);
        },
        gameDelete(state, action: PayloadAction<string>) {
            gamesAdapter.removeOne(state, action.payload);
        }
    }
})

interface GamesSlice {
    games: typeof initialState
}

export const {
    updateGame,
    roundNext,
    roundPrevious,
    gameSave,
    gameDelete
} = gamesSlice.actions

export default gamesSlice.reducer

// Export the customized selectors for this adapter using `getSelectors`
export const {
    selectAll: selectAllGames,
    selectById: selectGameById,
    selectIds: selectGameIds
    // Pass in a selector that returns the posts slice of state
} = gamesAdapter.getSelectors((state: GamesSlice) => state.games)
