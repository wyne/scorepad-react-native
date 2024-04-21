import { createSelector } from '@reduxjs/toolkit';

import { GameState } from '../../../redux/GamesSlice';
import { ScoreState, selectAllPlayers } from '../../../redux/PlayersSlice';
import { RootState } from '../../../redux/store';

export const selectSortedPlayerIdsByIndex = createSelector(
    [
        (state: RootState) => state.settings.currentGameId ? state.games.entities[state.settings.currentGameId] : undefined,
        (state: RootState) => state.settings.currentGameId ? state.games.entities[state.settings.currentGameId]?.sortDirectionKey : undefined
    ],
    (game: GameState | undefined, sortDirectionKey: SortDirectionKey | undefined) => {
        if (!game) return [];

        const playerIds = game.playerIds
            .sort((a, b) => {
                if (game?.playerIds == undefined) return 0;
                return game.playerIds.indexOf(a) - game.playerIds.indexOf(b);
            })
            .map(player => player);

        if (SortDirectionKey.Normal === sortDirectionKey) {
            return playerIds;
        } else {
            return playerIds.reverse();
        }
    }
);

export const selectSortedPlayerIdsByScore: SortSelector = createSelector(
    [
        selectAllPlayers,
        (state: RootState) => state.settings.currentGameId ? state.games.entities[state.settings.currentGameId] : undefined,
        (state: RootState) => state.settings.currentGameId ? state.games.entities[state.settings.currentGameId]?.sortDirectionKey : undefined
    ],
    (players: ScoreState[], currentGame: GameState | undefined, sortDirectionKey: SortDirectionKey | undefined) => {
        if (!currentGame) return [];

        const playerIds = [...players]
            .filter(player => currentGame.playerIds?.includes(player.id))
            .sort((a, b) => {
                const totalScoreA = a.scores.reduce((acc, score) => acc + score, 0);
                const totalScoreB = b.scores.reduce((acc, score) => acc + score, 0);
                const scoreDifference = totalScoreB - totalScoreA;

                if (scoreDifference === 0) {
                    // If the total scores are equal, sort by player index
                    const indexA = currentGame.playerIds?.indexOf(a.id) || 0;
                    const indexB = currentGame.playerIds?.indexOf(b.id) || 0;
                    return indexA - indexB;
                }

                return totalScoreB - totalScoreA;
            })
            .map(player => player.id);

        if (sortDirectionKey === SortDirectionKey.Normal) {
            return playerIds;
        } else {
            return playerIds.reverse();
        }
    }
);

export interface SortSelector {
    (state: RootState): string[];
}

export enum SortSelectorKey {
    ByScore = 'byScore',
    ByIndex = 'byIndex',
}

export enum SortDirectionKey {
    Normal = 'normal',
    Reversed = 'reversed',
}

export const sortSelectors = {
    [SortSelectorKey.ByScore]: selectSortedPlayerIdsByScore,
    [SortSelectorKey.ByIndex]: selectSortedPlayerIdsByIndex,
};
