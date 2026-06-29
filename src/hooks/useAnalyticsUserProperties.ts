import { useEffect } from 'react';

import { useAppSelector } from '../../redux/hooks';
import { setUserProperty } from '../Analytics';

/**
 * Keeps GA4 user properties in sync with the user's persistent settings.
 *
 * Each effect fires on mount (so existing users report their current values —
 * user properties aren't retroactive) and again whenever the setting changes.
 * Mounted once at the app shell.
 */
export const useAnalyticsUserProperties = () => {
    const keepScreenAwake = useAppSelector(state => state.settings.keepScreenAwake);
    const pointParticles = useAppSelector(state => state.settings.showPointParticles);
    const playerIndex = useAppSelector(state => state.settings.showPlayerIndex);
    const colorScheme = useAppSelector(state => state.settings.colorScheme);

    useEffect(() => { setUserProperty('keep_screen_awake', String(keepScreenAwake)); }, [keepScreenAwake]);
    useEffect(() => { setUserProperty('point_particles', String(pointParticles)); }, [pointParticles]);
    useEffect(() => { setUserProperty('player_index', String(playerIndex)); }, [playerIndex]);
    useEffect(() => { setUserProperty('color_scheme', colorScheme); }, [colorScheme]);
};
