import { useCallback } from 'react';

import { setGamePlayerNumbers } from '../../redux/GamesSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { setPlayerNumbers } from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';
import { PlayerNumberStyle } from '../components/PlayerTiles/PlayerNumberStyle';

/**
 * Set the player number style for the current game, and update the global
 * default so new games inherit the most recently chosen style.
 */
export function useApplyPlayerNumbers() {
    const dispatch = useAppDispatch();
    const currentGameId = useAppSelector(state => state.settings.currentGameId);

    return useCallback((style: PlayerNumberStyle) => {
        if (currentGameId) {
            dispatch(setGamePlayerNumbers({ gameId: currentGameId, playerNumbers: style }));
        }
        dispatch(setPlayerNumbers(style));
        logEvent('set_player_numbers', { player_numbers: style, game_id: currentGameId });
    }, [dispatch, currentGameId]);
}
