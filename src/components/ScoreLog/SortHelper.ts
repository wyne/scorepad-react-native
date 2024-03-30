import { createSelector } from '@reduxjs/toolkit';

import { GameState } from '../../../redux/GamesSlice';
import { ScoreState, selectAllPlayers } from '../../../redux/PlayersSlice';
import { RootState } from '../../../redux/store';

export const selectPlayerIdsByIndex: SortSelector = createSelector(
    [
        selectAllPlayers,
        (state: RootState) => state.settings.currentGameId ? state.games.entities[state.settings.currentGameId] : undefined
    ],
    (players: ScoreState[], currentGame: GameState | undefined) => {
        if (!currentGame) return [];

        return players.filter(player => currentGame.playerIds?.includes(player.id))
            .sort((a, b) => {
                if (currentGame?.playerIds == undefined) return 0;
                return currentGame.playerIds.indexOf(a.id) - currentGame.playerIds.indexOf(b.id);
            })
            .map(player => player.id);
    }
);

export const selectPlayerIdsByScore: SortSelector = createSelector(
    [
        selectAllPlayers,
        (state: RootState) => state.settings.currentGameId ? state.games.entities[state.settings.currentGameId] : undefined
    ],
    (players: ScoreState[], currentGame: GameState | undefined) => {
        if (!currentGame) return [];

        return [...players]
            .filter(player => currentGame.playerIds?.includes(player.id))
            .sort((a, b) => {
                const totalScoreA = a.scores.reduce((acc, score) => acc + score, 0);
                const totalScoreB = b.scores.reduce((acc, score) => acc + score, 0);
                return totalScoreB - totalScoreA;
            })
            .map(player => player.id);
    }
);

export interface SortSelector {
    (state: RootState): string[];
}
export const sortSelectors: SortSelector[] = [
    selectPlayerIdsByScore,
    selectPlayerIdsByIndex,
];
