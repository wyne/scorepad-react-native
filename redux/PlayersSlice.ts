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
        }
    }
});

interface PlayersSlice {
    players: typeof initialState;
}

export const {
    updatePlayer,
    removePlayer,
    playerAdd,
    playerRoundScoreIncrement,
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
