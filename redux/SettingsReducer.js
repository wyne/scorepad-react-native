import {
    TOGGLE_HOME_FULLSCREEN,
    TOGGLE_MULTIPLIER,
} from "./SettingsActions";

const initialState = {
    home_fullscreen: false,
    multiplier: 1,
}

const settingsReducer = (state = initialState, action) => {
    switch (action.type) {
        case TOGGLE_HOME_FULLSCREEN:
            return { ...state, home_fullscreen: !state.home_fullscreen };

        case TOGGLE_MULTIPLIER:
            return { ...state, multiplier: state.multiplier == 1 ? 5 : 1 };

        default:
            return state;
    }
};

export default settingsReducer;