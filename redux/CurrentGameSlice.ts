import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import 'react-native-get-random-values'
import { v4 as uuidv4 } from 'uuid'

export interface GameState {
    uuid: string;
    players: { name: string; uuid: string }[];
    scores: number[][];
    currentRound: number;
    dateCreated: number;
}

type PlayerIndex = number;

const initialState: GameState = {
    uuid: uuidv4(),
    dateCreated: Date.now(),
    players: [
        { name: 'Player 1', uuid: uuidv4() },
        { name: 'Player 2', uuid: uuidv4() },
    ],
    scores: [
        [0],
        [0],
    ],
    currentRound: 0,
}

const currentGameSlice = createSlice({
    name: 'currentGame',
    initialState,
    reducers: {
        playerRoundScoreIncrement: {
            reducer(
                state,
                action: PayloadAction<PlayerIndex, string, { multiplier: number }>
            ) {
                if (state.scores[action.payload][state.currentRound] === undefined) {
                    state.scores[action.payload][state.currentRound] = 0;
                }

                state.scores[action.payload][state.currentRound] += action.meta.multiplier || 1;
            },
            prepare(payload: PlayerIndex, multiplier: number) {
                return { payload, meta: { multiplier } };
            },
        },
        playerRoundScoreDecrement: {
            reducer(
                state,
                action: PayloadAction<PlayerIndex, string, { multiplier: number }>
            ) {
                if (state.scores[action.payload][state.currentRound] === undefined) {
                    state.scores[action.payload][state.currentRound] = 0;
                }

                state.scores[action.payload][state.currentRound] -= (action.meta.multiplier || 1);
            },
            prepare(payload: number, multiplier: number) {
                return { payload, meta: { multiplier } };
            },
        },
        roundNext(state) {
            state.currentRound++;

            // TODO: clean up
            if (state.scores[0][state.currentRound] === undefined) {
                state.players.forEach((name, index) => {
                    state.scores[index][state.currentRound] = 0;
                })
            }
        },
        roundPrevious(state) {
            if (state.currentRound > 0) {
                state.currentRound--;
            }
        },
        playerNameSet: {
            reducer(state, action: PayloadAction<PlayerIndex, string, { name: string }>) {
                state.players[action.payload].name = action.meta.name;
            },
            prepare(payload: PlayerIndex, name: string) {
                return { payload, meta: { name } };
            }
        },
        playerAdd: {
            reducer(state, action: PayloadAction<string, string, { uuid: string }>) {
                state.players.push({
                    name: action.payload,
                    uuid: action.meta.uuid,
                });
                state.scores.push(
                    Array<number>(state.scores[0].length).fill(0)
                )
            },
            prepare(payload: string) {
                const uuid = uuidv4();
                return { payload, meta: { uuid } };
            }
        },
        playerRemove(state, action) {
            state.players.splice(action.payload, 1)
            state.scores.splice(action.payload, 1)
        },
        gameNew: {
            reducer(state, action: PayloadAction<string, string, { uuid: string }>) {
                state.uuid = action.meta.uuid;
                state.players.forEach((name, index) => {
                    state.scores[index] = [0]
                })
                state.currentRound = 0;
                state.dateCreated = Date.now();
            },
            prepare(payload: string) {
                const uuid = uuidv4();
                return { payload, meta: { uuid } };
            }
        },
        gameRestore(state, action: PayloadAction<GameState>) {
            state.uuid = action.payload.uuid;
            state.players = action.payload.players;
            state.scores = action.payload.scores;
            state.currentRound = action.payload.currentRound;
            state.dateCreated = action.payload.dateCreated;
        },
        gameUnset(state) {
            state.uuid = '';
            state.players = [];
            state.scores = [];
            state.currentRound = 0;
            state.dateCreated = 0;
        }
    }
})

export const {
    playerRoundScoreIncrement,
    playerRoundScoreDecrement,
    roundNext,
    roundPrevious,
    playerNameSet,
    playerAdd,
    playerRemove,
    gameNew,
    gameRestore,
    gameUnset,
} = currentGameSlice.actions

export default currentGameSlice.reducer
