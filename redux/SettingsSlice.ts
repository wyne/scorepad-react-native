import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface SettingsState {
    home_fullscreen: boolean;
    multiplier: number;
    currentGameId: string | undefined;
}

const initialState: SettingsState = {
    home_fullscreen: false,
    multiplier: 1,
    currentGameId: undefined,
}

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
        toggleMultiplier(state) {
            const multipliers = [1, 5, 10, 20, 50];
            let index = multipliers.indexOf(state.multiplier);
            if (index == multipliers.length - 1) {
                index = 0;
            } else {
                index++;
            }
            state.multiplier = multipliers[index];
        }
    }
})

export const {
    setCurrentGameId,
    toggleHomeFullscreen,
    toggleMultiplier
} = settingsSlice.actions

export default settingsSlice.reducer
