import { useCallback } from 'react';

import * as StoreReview from 'expo-store-review';

import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { selectCurrentGame, selectLastStoreReviewPrompt } from '../../redux/selectors';
import { setLastStoreReviewPrompt } from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';
import logger from '../Logger';

/** Minimum games created before we'll ever ask for a review. */
export const MIN_GAMES_FOR_REVIEW = 3;
/** Minimum days between prompts. Apple throttles independently; this is our own floor. */
export const REVIEW_PROMPT_INTERVAL_DAYS = 90;

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface ReviewEligibility {
    gameCount: number;
    /** Current round of the active game; 0 means the user hasn't scored anything yet. */
    roundCurrent: number;
    /** Epoch ms of the last prompt. 0 = never prompted. */
    lastPrompt: number;
    now: number;
}

/**
 * Pure gate for the review prompt. Kept separate from the hook so the rules are
 * testable without a store, a renderer, or the native module.
 */
export const shouldPromptForReview = (
    { gameCount, roundCurrent, lastPrompt, now }: ReviewEligibility,
): boolean => {
    if (gameCount < MIN_GAMES_FOR_REVIEW) return false;
    // Don't ask someone who opened a game but never scored in it.
    if (roundCurrent < 1) return false;

    const daysSinceLastPrompt = (now - lastPrompt) / MS_PER_DAY;
    return daysSinceLastPrompt >= REVIEW_PROMPT_INTERVAL_DAYS;
};

/**
 * Returns a callback that asks for an App Store review when the user looks
 * happy enough to ask: they've made a few games and actually played the current
 * one, and we haven't asked in the last 90 days.
 *
 * This lives in a hook rather than inside a button because the previous
 * implementation was inlined in HomeButton and was deleted along with that
 * component during the v3.0.0 navigation refactor, silently disabling review
 * prompts for three months.
 *
 * The timestamp is recorded only once the native prompt is actually requested —
 * recording it before the availability check would burn the full 90-day window
 * on a user who was never shown anything.
 */
export function useStoreReviewPrompt(): () => Promise<void> {
    const gameCount = useAppSelector(state => state.games.ids.length);
    const roundCurrent = useAppSelector(state => selectCurrentGame(state)?.roundCurrent ?? 0);
    const lastPrompt = useAppSelector(selectLastStoreReviewPrompt);
    const dispatch = useAppDispatch();

    return useCallback(async () => {
        const now = Date.now();

        if (!shouldPromptForReview({ gameCount, roundCurrent, lastPrompt, now })) return;

        try {
            // iOS may decline to show anything (its own rate limit); Android
            // needs Play Services. Either way we learn nothing was shown.
            const isAvailable = await StoreReview.isAvailableAsync();
            if (!isAvailable) {
                void logEvent('review_prompt_skipped', { reason: 'unavailable', game_count: gameCount });
                return;
            }

            await StoreReview.requestReview();

            dispatch(setLastStoreReviewPrompt(now));
            void logEvent('review_prompt', {
                game_count: gameCount,
                days_since_last: lastPrompt === 0
                    ? undefined
                    : Math.round((now - lastPrompt) / MS_PER_DAY),
            });
        } catch (error) {
            logger.error('STORE_REVIEW_ERROR', error);
            void logEvent('review_prompt_skipped', { reason: 'error', game_count: gameCount });
        }
    }, [gameCount, roundCurrent, lastPrompt, dispatch]);
}
