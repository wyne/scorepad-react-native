import { createSelector } from '@reduxjs/toolkit';

import { InteractionType } from '../src/components/Interactions/InteractionType';

import { selectGameById } from './GamesSlice';
import { RootState } from './store';

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
export const selectLastStoreReviewPrompt = (state: RootState) => state.settings.lastStoreReviewPrompt;

/** Names the app assigns to new players, e.g. "Player 3". */
const DEFAULT_PLAYER_NAME = /^Player \d+$/;

/**
 * Player names from every game, most recently created game first, in seat
 * order within a game. Each name appears once, at its most recent use, and
 * default "Player N" names are left out.
 */
export const selectRecentPlayerNames = createSelector(
    [
        (state: RootState) => state.games.entities,
        (state: RootState) => state.players.entities,
    ],
    (gameEntities, playerEntities) => {
        const games = Object.values(gameEntities)
            .filter((game) => game != null)
            .sort((a, b) => b.dateCreated - a.dateCreated);

        const names = new Set<string>();
        for (const game of games) {
            for (const playerId of game.playerIds) {
                const name = playerEntities[playerId]?.playerName;
                if (name && !DEFAULT_PLAYER_NAME.test(name)) names.add(name);
            }
        }
        return [...names];
    }
);

/**
 * Whether a game shows game mode UI: always for a game that already has
 * rules, otherwise only while the developer flag is on. Turning the flag off
 * hides modes for new games without taking them away from existing ones.
 */
export const selectGameModesVisible = (state: RootState, gameId?: string): boolean => {
    if (state.settings.gameModesEnabled) return true;
    return gameId ? selectGameById(state, gameId)?.scoring !== undefined : false;
};
