import {
    TOGGLE_HOME_FULLSCREEN,
} from "./SettingsActions";

const initialState = {
    home_fullscreen: false,
}

const settingsReducer = (state = initialState, action) => {
    switch (action.type) {
        case TOGGLE_HOME_FULLSCREEN:
            return { ...state, home_fullscreen: !state.home_fullscreen };

        default:
            return state;
    }
};

export default settingsReducer;