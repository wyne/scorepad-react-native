import { useCallback } from 'react';

import { setGameInteractionType } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { setInteractionType } from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';
import { InteractionType } from '../components/Interactions/InteractionType';

const EVENT_NAMES: Record<InteractionType, string> = {
    [InteractionType.SwipeVertical]: 'swipe_vertical',
    [InteractionType.HalfTap]: 'half_tap',
    [InteractionType.Dial]: 'radial_gesture',
};

/**
 * Set the gesture for the current game, and update the global default so new
 * games inherit the most recently chosen gesture.
 */
export function useApplyInteractionType() {
    const dispatch = useAppDispatch();
    const currentGameId = useAppSelector(state => state.settings.currentGameId);

    return useCallback((type: InteractionType) => {
        if (currentGameId) {
            dispatch(setGameInteractionType({ gameId: currentGameId, interactionType: type }));
        }
        dispatch(setInteractionType(type));
        logEvent('set_interaction', { interaction_type: EVENT_NAMES[type], game_id: currentGameId });
    }, [dispatch, currentGameId]);
}
