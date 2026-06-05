import { InteractionType } from '../src/components/Interactions/InteractionType';

import { selectGameById } from './GamesSlice';
import { RootState } from './store';

export const selectInteractionType = (state: RootState) => {
    const interactionType: InteractionType = state.settings.interactionType;

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

export const selectGameHasScores = (state: RootState): boolean => {
    const game = selectCurrentGame(state);
    if (!game) return false;
    return game.playerIds.some(id => state.players.entities[id]?.scores.some(s => s !== 0));
};
