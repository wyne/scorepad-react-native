import { createSelector } from 'reselect';

// New

export const selectPlayersByIds = createSelector(
    // Build params
    [
        state => state.players.entities,
        (state, playerIds: string[]) => playerIds,
    ],
    // Selector
    (scores, playerIds: string[]) => {
        if (typeof playerIds === 'undefined') {
            return [];
        }
        return playerIds.map((i) => {
            return scores[i];
        });
    }
);
