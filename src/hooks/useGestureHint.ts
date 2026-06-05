import { useEffect, useRef, useState } from 'react';

import { useAppSelector } from '../../redux/hooks';
import { selectCurrentGame, selectInteractionType } from '../../redux/selectors';
import { InteractionType } from '../components/Interactions/InteractionType';

function useScoreFingerprint(): number {
    return useAppSelector(state => {
        const game = selectCurrentGame(state);
        if (!game) return 0;
        return game.playerIds.reduce((sum, id) => {
            const scores = state.players.entities[id]?.scores ?? [];
            return sum + scores.reduce((s, v) => s + Math.abs(v), 0);
        }, 0);
    });
}

export function useGestureHint(): boolean {
    const interactionType = useAppSelector(selectInteractionType);
    const fingerprint = useScoreFingerprint();
    const gameLocked = useAppSelector(state => selectCurrentGame(state)?.locked ?? false);
    const [lastScoredGesture, setLastScoredGesture] = useState<InteractionType | null>(null);

    // Reset hint when gesture type changes
    useEffect(() => {
        setLastScoredGesture(null);
    }, [interactionType]);

    // Dismiss hint once the user scores with the current gesture
    const prevFingerprint = useRef(fingerprint);
    useEffect(() => {
        if (fingerprint !== prevFingerprint.current) {
            prevFingerprint.current = fingerprint;
            setLastScoredGesture(interactionType);
        }
    }, [fingerprint, interactionType]);

    return !gameLocked && lastScoredGesture !== interactionType;
}
