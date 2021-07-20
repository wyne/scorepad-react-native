import { SET_PLAYER_NAME } from "../actions/Players";

const initialState = {
    players: [
        'Player 1',
        'Player 2',
        'Player 3',
        'Player 4',
    ]
};

const playersReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_PLAYER_NAME:
            let copy = [...state.players];
            copy[action.index] = action.name;
            return { ...state, players: copy };
        default:
            return state;
    }
}

export default playersReducer;