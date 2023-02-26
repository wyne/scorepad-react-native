import { createSelector } from 'reselect';

// https://flufd.github.io/reselect-with-multiple-parameters/
export const selectScoreTotalByPlayer = createSelector(
    // Build params
    [
        state => state.currentGame.scores,
        (state, playerIndex) => playerIndex
    ],
    // Selector
    (scores: number[][], playerIndex: number) => {
        return scores[playerIndex].reduce(
            (sum: number, current: number, round: number) => {
                if (round > round) { return sum; }
                return (sum || 0) + (current || 0);
            }
        )
    }
);

export const selectScoreByPlayerAndRound = createSelector(
    // Build params
    [
        state => state.currentGame.scores,
        (state, playerIndex: number) => playerIndex,
        (state, playerIndex, round: number) => round,
    ],
    // Selector
    (scores: number[][], playerIndex: number, round: number) => {
        return scores[playerIndex][round] || 0;
    }
);
