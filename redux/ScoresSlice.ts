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

const scoresAdapter = createEntityAdapter({
    // selectId: (score: ScoreState) => score.uuid,
    sortComparer: (a: ScoreState, b: ScoreState) => (
        a.scores.reduce((a, b) => a + b, 0)) < b.scores.reduce((a, b) => a + b, 0) ? 1 : -1,
})

const initialState = scoresAdapter.getInitialState({
})

const scoresSlice = createSlice({
    name: 'scores',
    initialState,
    reducers: {
        scoreAdd(state, action: PayloadAction<ScoreState>) {
            scoresAdapter.upsertOne(state, action.payload);
        },
        playerRoundScoreIncrement: {
            reducer(
                state,
                action: PayloadAction<RoundIndex, string, { multiplier: number }>
            ) {
                try {
                    state.entities.scores[action.payload] += action.meta.multiplier;
                } catch (error) {
                    Sentry.React.captureException(error);
                }
            },
            prepare(payload: RoundIndex, multiplier: number) {
                return { payload, meta: { multiplier } };
            },
        },
        playerRoundScoreDecrement: {
            reducer(
                state,
                action: PayloadAction<RoundIndex, string, { multiplier: number }>
            ) {
                try {
                    state.entities.scores[action.payload] += action.meta.multiplier;
                } catch (error) {
                    Sentry.React.captureException(error);
                }
            },
            prepare(payload: RoundIndex, multiplier: number) {
                return { payload, meta: { multiplier } };
            },
        },
        roundNext(state, action) {
            state.entities.scores[action.payload] = 0;
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
    selectAll: selectAllScores,
    selectById: selectScoreById,
    selectIds: selectScoreIds
    // Pass in a selector that returns the posts slice of state 
} = scoresAdapter.getSelectors(state => state.scores)
