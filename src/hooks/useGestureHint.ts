import { useEffect, useRef, useState } from 'react';

import { useAppSelector } from '../../redux/hooks';
import { selectCurrentGame, selectInteractionType } from '../../redux/selectors';

export function useGestureHint(): boolean {
    const currentGameId = useAppSelector(state => state.settings.currentGameId);
    const interactionType = useAppSelector(state => selectInteractionType(state, currentGameId));
    const gameLocked = useAppSelector(state => selectCurrentGame(state)?.locked ?? false);

    const fingerprint = useAppSelector(state => {
        const game = selectCurrentGame(state);
        if (!game) return 0;
        return game.playerIds.reduce((sum, id) => {
            const scores = state.players.entities[id]?.scores ?? [];
            return sum + scores.reduce((s, v) => s + Math.abs(v), 0);
        }, 0);
    });

    // Initialize false when scores exist — no flash on reopen with existing scores.
    const [showHint, setShowHint] = useState(() => fingerprint === 0);
    const isFirstRun = useRef(true);

    // Re-enable hint on gesture switch. Skip on mount so initialization holds.
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        setShowHint(true);
    }, [interactionType]);

    // Dismiss hint whenever scores exist.
    // interactionType intentionally omitted: gesture switches must not re-trigger dismissal.
    useEffect(() => {
        if (fingerprint > 0) {
            setShowHint(false);
        }
    }, [fingerprint]);

    return !gameLocked && showHint;
}
