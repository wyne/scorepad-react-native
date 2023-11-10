import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SemVer, valid } from 'semver';
import * as Application from 'expo-application';

export interface SettingsState {
    home_fullscreen: boolean;
    multiplier: number;
    currentGameId: string | undefined;
    onboarded: string | undefined;
    showPointParticles: boolean;
};

const initialState: SettingsState = {
    home_fullscreen: false,
    multiplier: 1,
    currentGameId: undefined,
    onboarded: undefined,
    showPointParticles: false,
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
        setOnboardedVersion(state) {
            const appVersion = new SemVer(Application.nativeApplicationVersion || '0.0.0');
            console.log(`Setting Onboarded Version: ${appVersion}`);
            state.onboarded = valid(appVersion) || '0.0.0';
        }
    }
});

export const {
    setCurrentGameId,
    toggleHomeFullscreen,
    setMultiplier,
    setOnboardedVersion,
    toggleshowPointParticles,
} = settingsSlice.actions;

export default settingsSlice.reducer;
