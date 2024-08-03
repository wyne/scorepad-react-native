import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as Application from 'expo-application';
import { SemVer, valid } from 'semver';

import { InteractionType } from '../src/components/Interactions/InteractionType';
import logger from '../src/Logger';

export interface SettingsState {
    home_fullscreen: boolean;
    multiplier: number;
    addendOne: number;
    addendTwo: number;
    currentGameId: string | undefined;
    onboarded: string | undefined;
    showPointParticles: boolean;
    showPlayerIndex: boolean;
    interactionType: InteractionType;
    lastStoreReviewPrompt: number;
    devMenuEnabled?: boolean;
    appOpens: number;
    installId: string | undefined;
    rollingGameCounter?: number;
};

export const initialState: SettingsState = {
    home_fullscreen: false,
    multiplier: 1,
    addendOne: 1,
    addendTwo: 10,
    currentGameId: undefined,
    onboarded: undefined,
    showPointParticles: false,
    showPlayerIndex: false,
    interactionType: InteractionType.SwipeVertical,
    lastStoreReviewPrompt: 0,
    appOpens: 0,
    installId: undefined,
    rollingGameCounter: 0,
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setCurrentGameId(state, action: PayloadAction<string>) {
            console.info('Setting Current Game: ', action.payload);
            state.currentGameId = action.payload;
        },
        toggleHomeFullscreen(state) {
            state.home_fullscreen = !state.home_fullscreen;
        },
        toggleShowPointParticles(state) {
            state.showPointParticles = !state.showPointParticles;
        },
        toggleShowPlayerIndex(state) {
            state.showPlayerIndex = !state.showPlayerIndex;
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
        setOnboardedVersion(state) {
            const appVersion = new SemVer(Application.nativeApplicationVersion || '0.0.0');
            logger.info(`Setting Onboarded Version: ${appVersion}`);
            state.onboarded = valid(appVersion) || '0.0.0';
        },
        setLastStoreReviewPrompt(state, action: PayloadAction<number>) {
            state.lastStoreReviewPrompt = action.payload;
        },
        toggleDevMenuEnabled(state) {
            state.devMenuEnabled = !state.devMenuEnabled;
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
    }
});

export const {
    setCurrentGameId,
    toggleHomeFullscreen,
    setMultiplier,
    setAddendOne,
    setAddendTwo,
    setOnboardedVersion,
    toggleShowPointParticles,
    toggleShowPlayerIndex,
    setInteractionType,
    setLastStoreReviewPrompt,
    toggleDevMenuEnabled,
    increaseAppOpens,
    setInstallId,
    incrementRollingGameCounter,
    setRollingGameCounter,
} = settingsSlice.actions;

export default settingsSlice.reducer;
