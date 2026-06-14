import { useAppSelector } from '../../redux/hooks';
import { selectCurrentGame, selectInteractionType } from '../../redux/selectors';

// Show the gesture hint when the active gesture differs from the one the user
// most recently used. `lastUsedInteractionType` is undefined for a brand-new
// user (hint shows until first use) and is updated only when a gesture is used
// (a score is committed) — never on a gesture change — so switching gestures
// re-shows the hint until the new gesture is used once. Locked games never show it.
export function useGestureHint(): boolean {
    const interactionType = useAppSelector(state => selectInteractionType(state, state.settings.currentGameId));
    const lastUsed = useAppSelector(state => state.settings.lastUsedInteractionType);
    const gameLocked = useAppSelector(state => selectCurrentGame(state)?.locked ?? false);

    return !gameLocked && interactionType !== lastUsed;
}
