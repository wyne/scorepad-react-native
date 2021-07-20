import { SET_PLAYER_NAME } from "../actions/Players";

const initialState = [
    'Player 1',
    'Player 2',
    'Player 3',
    'Player 4',
];

const playersReducer = (state = initialState, action) => {
    switch (action.type) {
        case SET_PLAYER_NAME:
            let copy = [...state];
            copy[action.index] = action.name;
            return copy;
        default:
            return state;
    }
}

export default playersReducer;