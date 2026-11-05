import AsyncStorage from '@react-native-async-storage/async-storage';
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, createMigrate } from 'redux-persist';

import gamesReducer, { backfillGamePlayerNumbers, GameState, restLockedGamesOnLastRound } from './GamesSlice';
import scoresReducer from './PlayersSlice';
import { selectInferredLearnedInteractionTypes } from './selectors';
import settingsReducer, { setLearnedInteractionTypes } from './SettingsSlice';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const settingsMigrations: any = {
    0: (state: Record<string, unknown> | undefined) => {
        const s: Record<string, unknown> = state ?? {};
        const keepScreenAwake = (s.keepScreenAwakeDuration as number ?? 0) > 0;
        delete s.keepScreenAwakeDuration;
        return { ...s, keepScreenAwake, seenFeatureNotifications: [] };
    },
    1: (state: Record<string, unknown> | undefined) => {
        return { ...state, colorScheme: 'system' };
    },
    2: (state: Record<string, unknown> | undefined) => {
        const validTypes = ['half-tap', 'swipe-vertical', 'dial'];
        const stored = state?.interactionType as string | undefined;
        const interactionType = stored && validTypes.includes(stored) ? stored : 'swipe-vertical';
        return { ...state, interactionType };
    },
    3: (state: Record<string, unknown> | undefined) => {
        // Seed last-used gesture from the existing global gesture so returning
        // users aren't shown the hint for a gesture they already use.
        return { ...state, lastUsedInteractionType: state?.interactionType };
    },
    5: (state: Record<string, unknown> | undefined) => {
        // Fresh installs default to every feature notification seen. Saved
        // settings that predate the list must not inherit that default, or
        // returning users would lose their badges.
        return { ...state, seenFeatureNotifications: state?.seenFeatureNotifications ?? [] };
    },
    6: (state: Record<string, unknown> | undefined) => {
        // The global Player Numbers switch became a per-game style. Games keep
        // showing numbers if the switch was on, now as the badge.
        const { showPlayerIndex, ...rest } = state ?? {};
        return { ...rest, playerNumbers: showPlayerIndex === true ? 'badge' : 'off' };
    },
    7: (state: Record<string, unknown> | undefined) => {
        // The gesture hint now remembers every gesture learned, not just the
        // last one used. Left unset here, since settings can't see games:
        // backfillLearnedGestures fills it in once everything is rehydrated.
        return { ...state, learnedInteractionTypes: undefined };
    },
};

export const settingsPersistConfig = {
    key: 'settings',
    version: 7,
    storage: AsyncStorage,
    migrate: createMigrate(settingsMigrations),
    whitelist: [
        'home_fullscreen',
        'multiplier',
        'addendOne',
        'addendTwo',
        'currentGameId',
        'onboarded',
        'showPointParticles',
        'playerNumbers',
        'interactionType',
        'lastUsedInteractionType',
        'learnedInteractionTypes',
        'lastStoreReviewPrompt',
        'devMenuEnabled',
        'gameModesEnabled',
        'appOpens',
        'installId',
        'rollingGameCounter',
        'keepScreenAwake',
        'seenFeatureNotifications',
        'colorScheme',
    ],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gamesMigrations: any = {
    1: (state: { entities?: Record<string, GameState> } | undefined) => {
        // Games locked before locking moved them to their last round.
        if (!state?.entities) return state;
        return { ...state, entities: restLockedGamesOnLastRound(state.entities) };
    },
};

export const gamesPersistConfig = {
    key: 'games',
    version: 1,
    storage: AsyncStorage,
    whitelist: ['entities', 'ids'],
    migrate: createMigrate(gamesMigrations),
};

const playersPersistConfig = {
    key: 'players',
    version: 0,
    storage: AsyncStorage,
    whitelist: ['entities', 'ids'],
};

export const store = configureStore({
    reducer: {
        settings: persistReducer(settingsPersistConfig, settingsReducer),
        games: persistReducer(gamesPersistConfig, gamesReducer),
        players: persistReducer(playersPersistConfig, scoresReducer),
    },
    // preloadedState: getPreloadedState(),
    middleware: getDefaultMiddleware => getDefaultMiddleware({
        serializableCheck: {
            ignoreActions: true
        },
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export interface RootState {
    settings: ReturnType<typeof settingsReducer>;
    games: ReturnType<typeof gamesReducer>;
    players: ReturnType<typeof scoresReducer>;
}

// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;

/** Pins games that predate per-game player numbers to the current default. */
export const backfillPlayerNumbers = (target: AppStore) => {
    target.dispatch(backfillGamePlayerNumbers(target.getState().settings.playerNumbers ?? 'off'));
};

/** After an upgrade, marks every gesture used in saved games as learned. */
export const backfillLearnedGestures = (target: AppStore) => {
    const state = target.getState();
    if (state.settings.learnedInteractionTypes !== undefined) return;
    target.dispatch(setLearnedInteractionTypes(selectInferredLearnedInteractionTypes(state)));
};

export const persistor = persistStore(store, null, () => {
    backfillPlayerNumbers(store);
    backfillLearnedGestures(store);
});

// exportData();
