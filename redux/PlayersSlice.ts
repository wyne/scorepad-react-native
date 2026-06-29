import crashlytics from '@react-native-firebase/crashlytics';
import { PayloadAction, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';

import { grandTotalScore, totalScoreBeforeRound } from './scoreUtils';
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
        grandTotalScore(b.scores) - grandTotalScore(a.scores) || a.id.localeCompare(b.id)
    ),
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
                    if (scores[action.meta.round] === action.meta.value) return;
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

export const selectAllPlayerNames = createSelector(
    [(state: RootState) => state.players.entities],
    (entities) => {
        const names: string[] = [];
        for (const player of Object.values(entities)) {
            if (player) names.push(player.playerName);
        }
        return [...new Set(names)];
    }
);

export const selectPlayerScoreByRound = createSelector(
    [
        (state: RootState) => state.players.entities,
        (state: RootState, playerId: string) => playerId,
        (state: RootState, playerId: string, round: number) => round,
    ],
    (entities, playerId, round) => entities[playerId]?.scores[round] || 0
);

export const selectPlayerGrandTotalScore = createSelector(
    [(state: RootState, playerId: string) => state.players.entities[playerId]],
    (player) => grandTotalScore(player?.scores)
);

export const selectPlayerRoundStats = createSelector(
    [
        (state: RootState, playerId: string) => state.players.entities[playerId],
        (state: RootState, playerId: string, currentRoundIndex: number) => currentRoundIndex,
    ],
    (player, currentRoundIndex) => {
        const scores = player?.scores ?? [];
        const currentRoundScore = scores[currentRoundIndex] ?? 0;
        const previousTotal = totalScoreBeforeRound(scores, currentRoundIndex);
        const currentRoundTotalScore = previousTotal + currentRoundScore;
        const grandTotal = grandTotalScore(scores);
        return { currentRoundScore, previousTotal, currentRoundTotalScore, grandTotalScore: grandTotal };
    }
);
