import { InteractionType } from '../src/components/Interactions/InteractionType';

import { RootState } from './store'; // Import your RootState type

export const selectInteractionType = (state: RootState) => {
    const interactionType: InteractionType = state.settings.interactionType;

    // Check if interactionType is a valid InteractionType
    const isValidInteractionType = Object.values(InteractionType).includes(interactionType);

    // If interactionType is not valid, fall back to a default value
    const safeInteractionType = isValidInteractionType ? interactionType : InteractionType.SwipeVertical;

    return safeInteractionType;
};
