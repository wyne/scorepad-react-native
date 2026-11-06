import { createSelector } from '@reduxjs/toolkit';

import { getPalette } from '../src/ColorPalette';
import { InteractionType } from '../src/components/Interactions/InteractionType';
import { isPlayerNumberStyle, PlayerNumberStyle } from '../src/components/PlayerTiles/PlayerNumberStyle';
import { MAX_TILE_PLAYERS } from '../src/constants';

import { selectAllGames, selectGameById } from './GamesSlice';
import { grandTotalScore } from './scoreUtils';
import { gameOverReason } from './ScoringRules';
import { RootState } from './store';

/** Whether the game has too many players for the tile gestures (tap and swipe). */
export const selectIsDialOnly = (state: RootState, gameId?: string): boolean => {
    const playerCount = gameId ? selectGameById(state, gameId)?.playerIds.length ?? 0 : 0;
    return playerCount > MAX_TILE_PLAYERS;
};

/** The game's player number style. The global default only covers a game
 * not yet backfilled, e.g. in the moment before rehydration finishes. */
export const selectPlayerNumbers = (state: RootState, gameId?: string): PlayerNumberStyle => {
    const gameLevel = gameId ? selectGameById(state, gameId)?.playerNumbers : undefined;
    if (isPlayerNumberStyle(gameLevel)) return gameLevel;
    return isPlayerNumberStyle(state.settings.playerNumbers) ? state.settings.playerNumbers : 'off';
};

export const selectInteractionType = (state: RootState, gameId?: string): InteractionType => {
    // Games too big for tiles always use the Dial. The saved gesture is left
    // alone, so it comes back if the game drops to MAX_TILE_PLAYERS or fewer.
    if (selectIsDialOnly(state, gameId)) return InteractionType.Dial;

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
/**
 * A player's color, falling back to their seat's palette color. Players created
 * before colors were stored per player have no `color` field.
 */
export const selectPlayerColor = (state: RootState, playerId: string, gameId = state.settings.currentGameId): string => {
    const color = state.players.entities[playerId]?.color;
    if (color) return color;

    const game = gameId ? selectGameById(state, gameId) : undefined;
    const palette = getPalette(game?.palette || 'original') || getPalette('original');
    const seat = Math.max(game?.playerIds.indexOf(playerId) ?? 0, 0);
    return palette[seat % palette.length];
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
        selectAllGames,
        (state: RootState) => state.players.entities,
    ],
    (games, playerEntities) => {
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

/** Each player's total in the current game, in seat order. */
export const selectCurrentGameTotals = createSelector(
    [
        (state: RootState) => selectCurrentGame(state),
        (state: RootState) => state.players.entities,
    ],
    (game, players) => (game?.playerIds ?? []).map(id => ({ id, total: grandTotalScore(players[id]?.scores) })),
);

/**
 * Why the current game is over once its current round is finished, or
 * undefined while play goes on. Only the latest round counts: stepping
 * forward through earlier rounds never ends a game.
 */
export const selectCurrentGameOverReason = createSelector(
    [
        (state: RootState) => selectCurrentGame(state),
        selectCurrentGameTotals,
    ],
    (game, totals) => {
        if (!game || game.locked) return undefined;
        if (game.roundCurrent + 1 < game.roundTotal) return undefined;
        return gameOverReason(game.scoring, game.roundCurrent + 1, totals);
    },
);

/**
 * Gestures a returning player has already used: the last one used, plus the
 * gesture of every saved game with a score in it. Seeds the learned list so
 * existing players don't see first-use hints for gestures they know.
 */
export const selectInferredLearnedInteractionTypes = (state: RootState): InteractionType[] => {
    const learned = new Set<InteractionType>();
    const lastUsed = state.settings.lastUsedInteractionType;
    if (lastUsed) learned.add(lastUsed);
    selectAllGames(state).forEach(game => {
        const played = game.playerIds.some(id =>
            state.players.entities[id]?.scores?.some(score => score !== 0));
        if (played) learned.add(selectInteractionType(state, game.id));
    });
    return [...learned];
};
