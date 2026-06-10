import { createSelector } from '@reduxjs/toolkit';

import { InteractionType } from '../src/components/Interactions/InteractionType';

import { selectGameById } from './GamesSlice';
import { RootState } from './store';

export interface PlayerScoreSummary {
    id: string;
    name: string;
    totalScore: number;
}

const EMPTY_PLAYER_IDS: string[] = [];

export const selectInteractionType = (state: RootState, gameId?: string): InteractionType => {
    // Prefer the game-level gesture; fall back to the global default for new games.
    const gameLevel = gameId ? selectGameById(state, gameId)?.interactionType : undefined;
    const interactionType: InteractionType = gameLevel ?? state.settings.interactionType;

    // Check if interactionType is a valid InteractionType
    const isValidInteractionType = Object.values(InteractionType).includes(interactionType);

    // If interactionType is not valid, fall back to a default value
    const safeInteractionType = isValidInteractionType ? interactionType : InteractionType.SwipeVertical;

    return safeInteractionType;
};

export const selectCurrentGame = (state: RootState) => {
    const currentGameId = state.settings.currentGameId;
    if (!currentGameId) return;

    return selectGameById(state, currentGameId);
};

export const selectGamePlayersByScore = createSelector(
    [
        (state: RootState, gameId: string | undefined) => gameId ? state.games.entities[gameId]?.playerIds ?? EMPTY_PLAYER_IDS : EMPTY_PLAYER_IDS,
        (state: RootState) => state.players.entities,
    ],
    (playerIds, players): PlayerScoreSummary[] => playerIds
        .map((id) => {
            const player = players[id];
            return {
                id,
                name: player?.playerName || '',
                totalScore: (player?.scores || []).reduce((total, score) => total + (score || 0), 0),
            };
        })
        .sort((a, b) => b.totalScore - a.totalScore)
);

export const selectLastStoreReviewPrompt = (state: RootState) => state.settings.lastStoreReviewPrompt;
