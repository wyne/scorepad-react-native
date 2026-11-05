import { useAppSelector } from '../../redux/hooks';
import { selectCurrentGame, selectInteractionType } from '../../redux/selectors';

// Show the gesture hint until the active gesture has been learned: scored with
// once, or its hint dismissed. Learned gestures are saved, so each gesture's
// hint shows once ever, even when games use different gestures. Locked games
// never show it.
export function useGestureHint(): boolean {
    const interactionType = useAppSelector(state => selectInteractionType(state, state.settings.currentGameId));
    const learned = useAppSelector(state => state.settings.learnedInteractionTypes ?? []);
    const gameLocked = useAppSelector(state => selectCurrentGame(state)?.locked ?? false);

    return !gameLocked && !learned.includes(interactionType);
}
