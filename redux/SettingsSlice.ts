import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as Application from 'expo-application';
import { SemVer, valid } from 'semver';

import { InteractionType } from '../src/components/Interactions/InteractionType';

export interface SettingsState {
    home_fullscreen: boolean;
    multiplier: number;
    addendOne: number;
    addendTwo: number;
    currentGameId: string | undefined;
    onboarded: string | undefined;
    showPointParticles: boolean;
    interactionType: InteractionType;
    lastStoreReviewPrompt: number;
};

const initialState: SettingsState = {
    home_fullscreen: false,
    multiplier: 1,
    addendOne: 1,
    addendTwo: 10,
    currentGameId: undefined,
    onboarded: undefined,
    showPointParticles: true,
    interactionType: InteractionType.SwipeVertical,
    lastStoreReviewPrompt: 0,
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setCurrentGameId(state, action: PayloadAction<string>) {
            state.currentGameId = action.payload;
        },
        toggleHomeFullscreen(state) {
            state.home_fullscreen = !state.home_fullscreen;
        },
        toggleshowPointParticles(state) {
            state.showPointParticles = !state.showPointParticles;
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
            console.log(`Setting Onboarded Version: ${appVersion}`);
            state.onboarded = valid(appVersion) || '0.0.0';
        },
        setLastStoreReviewPrompt(state, action: PayloadAction<number>) {
            state.lastStoreReviewPrompt = action.payload;
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
    toggleshowPointParticles,
    setInteractionType,
    setLastStoreReviewPrompt,
} = settingsSlice.actions;

export default settingsSlice.reducer;
