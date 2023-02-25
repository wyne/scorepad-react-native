import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import 'react-native-get-random-values'
import { v4 as uuidv4 } from 'uuid'

interface CurrentGameState {
    players: { name: string; uuid: string }[];
    scores: number[][];
    currentRound: number;
}

type PlayerIndex = number;

const initialState: CurrentGameState = {
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
        playerAdd(state, action) {
            state.players.push({
                name: action.payload,
                uuid: uuidv4()
            });

            state.scores.push(
                Array<number>(state.scores[0].length).fill(0)
            );
        },
        playerRemove(state, action) {
            state.players.splice(action.payload, 1)
            state.scores.splice(action.payload, 1)
        },
        gameNew(state, action) {
            state.players.forEach((name, index) => {
                state.scores[index] = [0]
            })

            state.currentRound = 0;
        },
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
} = currentGameSlice.actions

export default currentGameSlice.reducer
