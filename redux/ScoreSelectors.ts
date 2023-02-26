import { createSelector } from 'reselect';

// https://flufd.github.io/reselect-with-multiple-parameters/
export const selectScoreTotalByPlayer = createSelector(
    // Build params
    [
        state => state.currentGame.scores,
        (state, playerIndex) => playerIndex
    ],
    // Selector
    (scores, playerIndex) => {
        return scores[playerIndex].reduce(
            (sum, current, round) => {
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
        (state, playerIndex) => playerIndex,
        (state, playerIndex, round) => round,
    ],
    // Selector
    (scores, playerIndex, round) => {
        return scores[playerIndex][round] || 0;
    }
);
