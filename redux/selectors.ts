import { InteractionType } from '../src/components/Interactions/InteractionType';

import { selectGameById } from './GamesSlice';
import { RootState } from './store';

const validInteractionTypes = new Set(Object.values(InteractionType));

export const selectInteractionType = (state: RootState, gameId?: string) => {
    if (gameId) {
        const gameType = selectGameById(state, gameId)?.interactionType;
        if (gameType && validInteractionTypes.has(gameType)) return gameType;
    }

    const globalType: InteractionType = state.settings.interactionType;
    return validInteractionTypes.has(globalType) ? globalType : InteractionType.SwipeVertical;
};

export const selectCurrentGame = (state: RootState) => {
    const currentGameId = state.settings.currentGameId;
    if (!currentGameId) return;

    return selectGameById(state, currentGameId);
};
export const selectLastStoreReviewPrompt = (state: RootState) => state.settings.lastStoreReviewPrompt;
