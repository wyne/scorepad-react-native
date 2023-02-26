import { GameState } from './CurrentGameSlice';
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type GameUUID = string;

interface GameHistoryState {
    games: {
        [uuid: GameUUID]: GameState;
    },
}

const initialState: GameHistoryState = {
    games: {},
}

const gameHistorySlice = createSlice({
    name: 'gameHistory',
    initialState,
    reducers: {
        gameSave(state, action: PayloadAction<GameState>) {
            state.games[action.payload.uuid] = action.payload;
        },
    }
})

export const { gameSave } = gameHistorySlice.actions

export default gameHistorySlice.reducer
