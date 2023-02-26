import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface SettingsState {
    home_fullscreen: boolean;
    multiplier: number;
}

const initialState: SettingsState = {
    home_fullscreen: false,
    multiplier: 1,
}

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        toggleHomeFullscreen(state, action) {
            state.home_fullscreen = !state.home_fullscreen;
        },
        toggleMultiplier(state, action) {
            var multipliers = [1, 5, 10, 20, 50];
            var index = multipliers.indexOf(state.multiplier);
            if (index == multipliers.length - 1) {
                index = 0;
            } else {
                index++;
            }
            state.multiplier = multipliers[index];
        }
    }
})

export const { toggleHomeFullscreen, toggleMultiplier } = settingsSlice.actions

export default settingsSlice.reducer
