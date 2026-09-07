import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react-native';
import * as StoreReview from 'expo-store-review';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';
import { InteractionType } from '../components/Interactions/InteractionType';

import {
    MIN_GAMES_FOR_REVIEW,
    REVIEW_PROMPT_INTERVAL_DAYS,
    shouldPromptForReview,
    useStoreReviewPrompt,
} from './useStoreReviewPrompt';

jest.mock('../Analytics');
jest.mock('expo-store-review', () => ({
    isAvailableAsync: jest.fn(),
    requestReview: jest.fn(),
}));

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const NOW = 1_700_000_000_000;
const daysAgo = (days: number) => NOW - days * MS_PER_DAY;

describe('shouldPromptForReview', () => {
    const eligible = { gameCount: 5, hasScored: true, lastPrompt: 0, now: NOW };

    it('prompts a user who qualifies and has never been prompted', () => {
        expect(shouldPromptForReview(eligible)).toBe(true);
    });

    it('does not prompt below the game threshold', () => {
        expect(shouldPromptForReview({ ...eligible, gameCount: MIN_GAMES_FOR_REVIEW - 1 })).toBe(false);
    });

    it('prompts exactly at the game threshold', () => {
        expect(shouldPromptForReview({ ...eligible, gameCount: MIN_GAMES_FOR_REVIEW })).toBe(true);
    });

    it('does not prompt a user who has made games but never scored', () => {
        expect(shouldPromptForReview({ ...eligible, hasScored: false })).toBe(false);
    });

    // Single-round games are 16% of all scored games. The previous gate keyed
    // off the current game reaching round 2, so those users were never asked.
    it('prompts a user whose games never leave the first round', () => {
        expect(shouldPromptForReview({ ...eligible, hasScored: true })).toBe(true);
    });

    it('does not prompt within the interval', () => {
        const lastPrompt = daysAgo(REVIEW_PROMPT_INTERVAL_DAYS - 1);
        expect(shouldPromptForReview({ ...eligible, lastPrompt })).toBe(false);
    });

    it('prompts once the full interval has elapsed', () => {
        const lastPrompt = daysAgo(REVIEW_PROMPT_INTERVAL_DAYS);
        expect(shouldPromptForReview({ ...eligible, lastPrompt })).toBe(true);
    });
});

interface StoreOpts {
    gameCount?: number;
    rollingGameCounter?: number;
    hasScored?: boolean;
    lastStoreReviewPrompt?: number;
}

const createStore = (opts: StoreOpts = {}) => {
    const gameCount = opts.gameCount ?? 5;
    const ids = Array.from({ length: gameCount }, (_, i) => `game-${i}`);
    const entities = Object.fromEntries(ids.map(id => [id, {
        id, playerIds: ['p1'], dateCreated: 0, roundCurrent: 0, roundTotal: 1, locked: false,
    }]));

    return configureStore({
        reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
        preloadedState: {
            settings: {
                currentGameId: ids[0],
                lastStoreReviewPrompt: opts.lastStoreReviewPrompt ?? 0,
                lastUsedInteractionType: (opts.hasScored ?? true)
                    ? InteractionType.SwipeVertical
                    : undefined,
                rollingGameCounter: opts.rollingGameCounter,
            },
            games: { entities, ids },
            players: { entities: { p1: { id: 'p1', playerName: 'P1', scores: [0] } }, ids: ['p1'] },
        } as Parameters<typeof configureStore>[0]['preloadedState'],
    });
};

const renderPrompt = (store: ReturnType<typeof createStore>) => renderHook(
    () => useStoreReviewPrompt(),
    {
        wrapper: ({ children }: { children: React.ReactNode }) =>
            React.createElement(Provider, { store, children }),
    },
);

describe('useStoreReviewPrompt', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Date, 'now').mockReturnValue(NOW);
        (StoreReview.isAvailableAsync as jest.Mock).mockResolvedValue(true);
        (StoreReview.requestReview as jest.Mock).mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('requests a review, records the timestamp, and logs it', async () => {
        const store = createStore();
        const { result } = renderPrompt(store);

        await result.current();

        expect(StoreReview.requestReview).toHaveBeenCalled();
        expect(store.getState().settings.lastStoreReviewPrompt).toBe(NOW);
        expect(logEvent).toHaveBeenCalledWith('review_prompt', { game_count: 5, days_since_last: undefined });
    });

    it('reports how long it had been since the previous prompt', async () => {
        const store = createStore({ lastStoreReviewPrompt: daysAgo(120) });
        const { result } = renderPrompt(store);

        await result.current();

        expect(logEvent).toHaveBeenCalledWith('review_prompt', { game_count: 5, days_since_last: 120 });
    });

    // 6% of users have played three or more games but keep fewer than three,
    // because they delete each one as it finishes. Counting the live list
    // rather than the high-water mark made them permanently unaskable.
    it('counts games ever played, not games still in the list', async () => {
        const store = createStore({ gameCount: 1, rollingGameCounter: 8 });
        const { result } = renderPrompt(store);

        await result.current();

        expect(StoreReview.requestReview).toHaveBeenCalledTimes(1);
        expect(logEvent).toHaveBeenCalledWith('review_prompt', { game_count: 8, days_since_last: undefined });
    });

    it('falls back to the live count when the rolling counter is unseeded', async () => {
        const store = createStore({ gameCount: 5, rollingGameCounter: undefined });
        const { result } = renderPrompt(store);

        await result.current();

        expect(StoreReview.requestReview).toHaveBeenCalledTimes(1);
        expect(logEvent).toHaveBeenCalledWith('review_prompt', { game_count: 5, days_since_last: undefined });
    });

    it('does nothing when the user is not eligible', async () => {
        const store = createStore({ gameCount: 2 });
        const { result } = renderPrompt(store);

        await result.current();

        expect(StoreReview.isAvailableAsync).not.toHaveBeenCalled();
        expect(StoreReview.requestReview).not.toHaveBeenCalled();
        expect(logEvent).not.toHaveBeenCalled();
    });

    it('does not consume the interval when the store prompt is unavailable', async () => {
        (StoreReview.isAvailableAsync as jest.Mock).mockResolvedValue(false);
        const store = createStore();
        const { result } = renderPrompt(store);

        await result.current();

        expect(StoreReview.requestReview).not.toHaveBeenCalled();
        expect(store.getState().settings.lastStoreReviewPrompt).toBe(0);
        expect(logEvent).toHaveBeenCalledWith('review_prompt_skipped', { reason: 'unavailable', game_count: 5 });
    });

    it('does not consume the interval when the native call throws', async () => {
        (StoreReview.requestReview as jest.Mock).mockRejectedValue(new Error('nope'));
        const store = createStore();
        const { result } = renderPrompt(store);

        await result.current();

        expect(store.getState().settings.lastStoreReviewPrompt).toBe(0);
        expect(logEvent).toHaveBeenCalledWith('review_prompt_skipped', { reason: 'error', game_count: 5 });
    });
});
