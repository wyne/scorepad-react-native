import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { InteractionType } from '../src/components/Interactions/InteractionType';
import { PlayerNumberStyle } from '../src/components/PlayerTiles/PlayerNumberStyle';
import { FEATURE_NOTIFICATIONS } from '../src/constants';

export interface SettingsState {
    home_fullscreen: boolean;
    multiplier: number;
    addendOne: number;
    addendTwo: number;
    currentGameId: string | undefined;
    showPointParticles: boolean;
    // Player number style new games start with (Settings > Player Numbers).
    // Each game can then change its own from the game options menu.
    playerNumbers: PlayerNumberStyle;
    interactionType: InteractionType;
    // The gesture the user most recently *used* (committed a score with).
    // undefined means "never scored" (new user).
    lastUsedInteractionType?: InteractionType;
    // Every gesture the user has scored with or dismissed the first-use hint
    // for. The hint shows only for gestures missing from this list.
    learnedInteractionTypes: InteractionType[];
    lastStoreReviewPrompt: number;
    devMenuEnabled?: boolean;
    // Offer game modes when setting up a game (Settings > Features). Games that
    // already have a mode keep it when this is turned off.
    gameModesEnabled?: boolean;
    appOpens: number;
    installId: string | undefined;
    rollingGameCounter?: number;
    keepScreenAwake: boolean;
    seenFeatureNotifications: string[];
    colorScheme: 'system' | 'light' | 'dark';
};

export const initialState: SettingsState = {
    home_fullscreen: false,
    multiplier: 1,
    addendOne: 1,
    addendTwo: 10,
    currentGameId: undefined,
    showPointParticles: false,
    playerNumbers: 'off',
    interactionType: InteractionType.SwipeVertical,
    lastUsedInteractionType: undefined,
    learnedInteractionTypes: [],
    lastStoreReviewPrompt: 0,
    appOpens: 0,
    // Seeded so the flag is always defined: logEvent strips undefined params,
    // which meant dev_menu_enabled only ever reached analytics as true.
    devMenuEnabled: false,
    gameModesEnabled: false,
    installId: undefined,
    rollingGameCounter: 0,
    keepScreenAwake: false,
    // Only used on a fresh install; existing users rehydrate their own list.
    seenFeatureNotifications: [...FEATURE_NOTIFICATIONS],
    colorScheme: 'system',
};

const addLearned = (state: SettingsState, type: InteractionType) => {
    const learned = state.learnedInteractionTypes ?? [];
    if (learned.includes(type)) return;
    state.learnedInteractionTypes = [...learned, type];
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setCurrentGameId(state, action: PayloadAction<string | undefined>) {
            console.info('Setting Current Game: ', action.payload);
            state.currentGameId = action.payload;
        },
        toggleHomeFullscreen(state) {
            state.home_fullscreen = !state.home_fullscreen;
        },
        toggleShowPointParticles(state) {
            state.showPointParticles = !state.showPointParticles;
        },
        setPlayerNumbers(state, action: PayloadAction<PlayerNumberStyle>) {
            state.playerNumbers = action.payload;
        },
        setMultiplier(state, action: PayloadAction<number>) {
            state.multiplier = action.payload;
        },
        setAddendOne(state, action: PayloadAction<number>) {
            state.addendOne = action.payload;
        },
        setAddendTwo(state, action: PayloadAction<number>) {
            state.addendTwo = action.payload;
        },
        setInteractionType(state, action: PayloadAction<InteractionType>) {
            state.interactionType = action.payload;
        },
        setLastUsedInteractionType(state, action: PayloadAction<InteractionType>) {
            // Called on every score: Immer returns the same state when nothing
            // changes, so once set this causes no re-render.
            state.lastUsedInteractionType = action.payload;
            addLearned(state, action.payload);
        },
        markInteractionLearned(state, action: PayloadAction<InteractionType>) {
            addLearned(state, action.payload);
        },
        setLastStoreReviewPrompt(state, action: PayloadAction<number>) {
            state.lastStoreReviewPrompt = action.payload;
        },
        toggleDevMenuEnabled(state) {
            state.devMenuEnabled = !state.devMenuEnabled;
        },
        setGameModesEnabled(state, action: PayloadAction<boolean>) {
            state.gameModesEnabled = action.payload;
        },
        increaseAppOpens(state) {
            state.appOpens += 1;
        },
        setInstallId(state, action: PayloadAction<string>) {
            state.installId = action.payload;
        },
        incrementRollingGameCounter(state) {
            state.rollingGameCounter = (state.rollingGameCounter ?? 0) + 1;
        },
        setRollingGameCounter(state, action: PayloadAction<number>) {
            state.rollingGameCounter = action.payload;
        },
        setKeepScreenAwake(state, action: PayloadAction<boolean>) {
            state.keepScreenAwake = action.payload;
        },
        markFeatureNotificationSeen(state, action: PayloadAction<string>) {
            if (!state.seenFeatureNotifications.includes(action.payload)) {
                state.seenFeatureNotifications.push(action.payload);
            }
        },
        resetSeenFeatureNotifications(state) {
            state.seenFeatureNotifications = [];
        },
        setColorScheme(state, action: PayloadAction<'system' | 'light' | 'dark'>) {
            state.colorScheme = action.payload;
        },
        restoreSettings(_state, action: PayloadAction<SettingsState>) {
            return action.payload;
        },
    }
});

export const {
    setCurrentGameId,
    toggleHomeFullscreen,
    setMultiplier,
    setAddendOne,
    setAddendTwo,
    toggleShowPointParticles,
    setPlayerNumbers,
    setInteractionType,
    setLastUsedInteractionType,
    markInteractionLearned,
    setLastStoreReviewPrompt,
    toggleDevMenuEnabled,
    setGameModesEnabled,
    increaseAppOpens,
    setInstallId,
    incrementRollingGameCounter,
    setRollingGameCounter,
    setKeepScreenAwake,
    markFeatureNotificationSeen,
    resetSeenFeatureNotifications,
    setColorScheme,
    restoreSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
