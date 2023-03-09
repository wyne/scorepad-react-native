import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import 'react-native-get-random-values'
import { v4 as uuidv4 } from 'uuid'
import { createEntityAdapter } from '@reduxjs/toolkit'
import Sentry from 'sentry-expo';

type RoundIndex = number;

interface ScoreState {
    playerName: string;
    scores: number[];
}

const playersAdapter = createEntityAdapter({
    // selectId: (score: ScoreState) => score.uuid,
    sortComparer: (a: ScoreState, b: ScoreState) => (
        a.scores.reduce((a, b) => a + b, 0)) < b.scores.reduce((a, b) => a + b, 0) ? 1 : -1,
})

const initialState = playersAdapter.getInitialState({
})

const scoresSlice = createSlice({
    name: 'players',
    initialState,
    reducers: {
        scoreAdd(state, action: PayloadAction<ScoreState>) {
            playersAdapter.upsertOne(state, action.payload);
        },
        playerRoundScoreIncrement: {
            reducer(
                state,
                action: PayloadAction<string, string, { round: RoundIndex, multiplier: number }>
            ) {
                try {
                    state.entities[action.payload].scores[action.meta.round] += action.meta.multiplier;
                } catch (error) {
                    Sentry.React.captureException(error);
                }
            },
            prepare(payload: string, round: RoundIndex, multiplier: number) {
                return { payload, meta: { round, multiplier } };
            },
        },
        playerRoundScoreDecrement: {
            reducer(
                state,
                action: PayloadAction<string, string, { round: RoundIndex, multiplier: number }>
            ) {
                try {
                    state.entities[action.payload].scores[action.meta.round] -= action.meta.multiplier;
                } catch (error) {
                    Sentry.React.captureException(error);
                }
            },
            prepare(payload: string, round: RoundIndex, multiplier: number) {
                return { payload, meta: { round, multiplier } };
            },
        },
        roundNext(state, action) {
            state.entities.players[action.payload] = 0;
        },
        playerNameSet(state, action) {
            state.entities.playerName = action.payload;
        },
    }
})

export const {
    scoreAdd,
    playerRoundScoreIncrement,
    playerRoundScoreDecrement,
    roundNext,
} = scoresSlice.actions

export default scoresSlice.reducer

export const {
    selectAll: selectAllPlayers,
    selectById: selectPlayerById,
    selectIds: selectPlayerIds
    // Pass in a selector that returns the posts slice of state 
} = playersAdapter.getSelectors(state => state.players)
