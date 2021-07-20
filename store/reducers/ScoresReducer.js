import { INC_PLAYER_ROUND_SCORE, DEC_PLAYER_ROUND_SCORE, NEXT_ROUND, PREV_ROUND } from "../actions/ScoresActions";

const initialState = {
    0: [0],
    1: [0],
    2: [0],
    3: [0],
    currentRound: 0,
    totalRounds: 1,
}

const scoresReducer = (state = initialState, action) => {
    switch (action.type) {
        case INC_PLAYER_ROUND_SCORE:
            const incrementedPlayerScores = [...state[action.index]];
            incrementedPlayerScores[state.currentRound] =
                (incrementedPlayerScores[state.currentRound] || 0) + 1;
            return { ...state, [action.index]: incrementedPlayerScores };
        case DEC_PLAYER_ROUND_SCORE:
            const decrementedPlayerScores = [...state[action.index]];
            decrementedPlayerScores[state.currentRound] =
                (decrementedPlayerScores[state.currentRound] || 0) - 1;
            return { ...state, [action.index]: decrementedPlayerScores };
        case PREV_ROUND:
            if (state.currentRound - 1 < 0) {
                return state;
            } else {
                const prevRound = state.currentRound - 1;
                return { ...state, currentRound: prevRound };
            }
        case NEXT_ROUND:
            const nextRound = state.currentRound + 1;

            // clean up
            if (state[0][nextRound] === undefined) {
                const copy = { ...state };

                const players = [0, 1, 2, 3];
                players.players.forEach((name, index) => {
                    copy[index][nextRound] = 0;
                })
                return {
                    ...state,
                    ...copy,
                    currentRound: nextRound
                };
            }

            return {
                ...state,
                currentRound: nextRound
            };
        default:
            return state;
    }
};

export default scoresReducer;