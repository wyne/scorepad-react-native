import crashlytics from '@react-native-firebase/crashlytics';
import { PayloadAction, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';

import { RootState } from './store';

type RoundIndex = number;

export interface ScoreState {
    id: string;
    playerName: string;
    scores: number[];
    color?: string;
}

const playersAdapter = createEntityAdapter({
    sortComparer: (a: ScoreState, b: ScoreState) => (
        a.scores.reduce((a, b) => a + b, 0)) < b.scores.reduce((a, b) => a + b, 0) ? 1 : -1,
});

const initialState = playersAdapter.getInitialState({
});

const scoresSlice = createSlice({
    name: 'players',
    initialState,
    reducers: {
        updatePlayer: playersAdapter.updateOne,
        removePlayer: playersAdapter.removeOne,
        playerAdd(state, action: PayloadAction<ScoreState>) {
            playersAdapter.upsertOne(state, action.payload);
        },
        restoreAllPlayers(state, action: PayloadAction<Record<string, ScoreState>>) {
            playersAdapter.setAll(state, action.payload);
        },
        playerRoundScoreIncrement: {
            reducer(
                state,
                action: PayloadAction<string, string, { round: RoundIndex, multiplier: number; }>
            ) {
                try {
                    const scores = state?.entities[action.payload]?.scores || [];
                    const round = action.meta.round;
                    const multiplier = action.meta.multiplier;

                    if (typeof scores[round] !== 'number') {
                        scores[round] = Number(scores[round]) || 0;
                    }
                    scores[round] += Number(multiplier);
                } catch (error) {
                    const err = error as Error;
                    crashlytics().recordError(err);
                }
            },
            prepare(payload: string, round: RoundIndex, multiplier: number) {
                return { payload, meta: { round, multiplier } };
            },
        },
        playerRoundScoreSet: {
            reducer(
                state,
                action: PayloadAction<string, string, { round: RoundIndex; value: number; }>
            ) {
                try {
                    const scores = state?.entities[action.payload]?.scores || [];
                    scores[action.meta.round] = action.meta.value;
                } catch (error) {
                    const err = error as Error;
                    crashlytics().recordError(err);
                }
            },
            prepare(payload: string, round: RoundIndex, value: number) {
                return { payload, meta: { round, value } };
            },
        },
    }
});

interface PlayersSlice {
    players: typeof initialState;
}

export const {
    updatePlayer,
    removePlayer,
    playerAdd,
    restoreAllPlayers,
    playerRoundScoreIncrement,
    playerRoundScoreSet,
} = scoresSlice.actions;

export default scoresSlice.reducer;

export const {
    selectAll: selectAllPlayers,
    selectById: selectPlayerById,
    selectIds: selectPlayerIds,
    // Pass in a selector that returns the posts slice of state 
} = playersAdapter.getSelectors((state: PlayersSlice) => state.players);

export const selectPlayerNameById = createSelector(
    [
        (state: RootState, playerId: string) => state.players.entities[playerId]
    ],
    (player) => player?.playerName
);

export const selectPlayerScoreByRound = createSelector(
    [
        (state: RootState) => state.players.entities,
        (state: RootState, playerId: string) => playerId,
        (state: RootState, playerId: string, round: number) => round,
    ],
    (entities, playerId, round) => entities[playerId]?.scores[round] || 0
);

export const selectPlayerRoundStats = createSelector(
    [
        (state: RootState, playerId: string) => state.players.entities[playerId],
        (state: RootState, playerId: string, roundCurrent: number) => roundCurrent,
    ],
    (player, roundCurrent) => {
        const scores = player?.scores ?? [];
        const roundScore = scores[roundCurrent] ?? 0;
        const previousTotal = scores.reduce(
            (sum, s, i) => (i < roundCurrent ? sum + (s || 0) : sum), 0
        );
        const currentTotal = previousTotal + roundScore;
        const grandTotal = scores.reduce((sum, s) => sum + (s || 0), 0);
        return { roundScore, previousTotal, currentTotal, grandTotal };
    }
);
