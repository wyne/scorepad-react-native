import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
    home_fullscreen: boolean;
    multiplier: number;
    currentGameId: string | undefined;
}

const initialState: SettingsState = {
    home_fullscreen: false,
    multiplier: 1,
    currentGameId: undefined,
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
        setMultiplier(state, action: PayloadAction<number>) {
            state.multiplier = action.payload;
        },
    }
});

export const {
    setCurrentGameId,
    toggleHomeFullscreen,
    setMultiplier,
} = settingsSlice.actions;

export default settingsSlice.reducer;
