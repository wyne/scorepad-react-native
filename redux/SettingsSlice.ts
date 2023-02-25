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
            state.multiplier = state.multiplier == 1 ? 5 : 1;
        }
    }
})

export const { toggleHomeFullscreen, toggleMultiplier } = settingsSlice.actions

export default settingsSlice.reducer
