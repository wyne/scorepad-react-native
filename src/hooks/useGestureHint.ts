import { useEffect, useState } from 'react';

import { useAppSelector } from '../../redux/hooks';
import { selectCurrentGame, selectInteractionType } from '../../redux/selectors';
import { InteractionType } from '../components/Interactions/InteractionType';

// Returns true once any player has a non-zero score, then stays true.
// This selector changes exactly once per game, preventing repeated re-renders.
function useHasAnyScore(): boolean {
    return useAppSelector(state => {
        const game = selectCurrentGame(state);
        if (!game) return false;
        return game.playerIds.some(id => {
            const scores = state.players.entities[id]?.scores ?? [];
            return scores.some(s => s !== 0);
        });
    });
}

export function useGestureHint(): boolean {
    const interactionType = useAppSelector(selectInteractionType);
    const hasAnyScore = useHasAnyScore();
    const gameLocked = useAppSelector(state => selectCurrentGame(state)?.locked ?? false);
    const [lastScoredGesture, setLastScoredGesture] = useState<InteractionType | null>(null);

    // Reset hint when gesture type changes
    useEffect(() => {
        setLastScoredGesture(null);
    }, [interactionType]);

    // Dismiss hint once any score exists
    useEffect(() => {
        if (hasAnyScore) {
            setLastScoredGesture(interactionType);
        }
    }, [hasAnyScore, interactionType]);

    return !gameLocked && lastScoredGesture !== interactionType;
}
