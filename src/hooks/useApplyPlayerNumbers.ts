import { useCallback } from 'react';

import { setGamePlayerNumbers } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { logEvent } from '../Analytics';
import { PlayerNumberStyle } from '../components/PlayerTiles/PlayerNumberStyle';

/**
 * Set the player number style for the current game only. The default for new
 * games lives in app settings.
 */
export function useApplyPlayerNumbers() {
    const dispatch = useAppDispatch();
    const currentGameId = useAppSelector(state => state.settings.currentGameId);

    return useCallback((style: PlayerNumberStyle) => {
        if (currentGameId) {
            dispatch(setGamePlayerNumbers({ gameId: currentGameId, playerNumbers: style }));
        }
        logEvent('set_player_numbers', { player_numbers: style, game_id: currentGameId });
    }, [dispatch, currentGameId]);
}
