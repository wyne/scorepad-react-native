import { INC_PLAYER_ROUND_SCORE, DEC_PLAYER_ROUND_SCORE, NEXT_ROUND, PREV_ROUND, SET_PLAYER_NAME, NEW_GAME, ADD_PLAYER, REMOVE_PLAYER } from "./CurrentGameActions"

const initialState = {
    players: [
        { name: 'Player 1' },
        { name: 'Player 2' },
        { name: 'Player 3' },
        { name: 'Player 4' },
    ],
    scores: {
        0: [0],
        1: [0],
        2: [0],
        3: [0],
    },
    currentRound: 0,
}

const currentGameReducer = (state = initialState, action) => {
    switch (action.type) {
        case INC_PLAYER_ROUND_SCORE:
            const incrementedPlayerScores = [...state.scores[action.index]];
            incrementedPlayerScores[state.currentRound] =
                (incrementedPlayerScores[state.currentRound] || 0) + 1;
            return { ...state, scores: { ...state.scores, [action.index]: incrementedPlayerScores } };

        case DEC_PLAYER_ROUND_SCORE:
            const decrementedPlayerScores = [...state.scores[action.index]];
            decrementedPlayerScores[state.currentRound] =
                (decrementedPlayerScores[state.currentRound] || 0) - 1;
            return { ...state, scores: { ...state.scores, [action.index]: decrementedPlayerScores } };

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
            if (state.scores[0][nextRound] === undefined) {
                const copy = { ...state.scores };

                state.players.forEach((name, index) => {
                    copy[index][nextRound] = 0;
                })
                return {
                    ...state,
                    scores: { ...state.scores, copy },
                    currentRound: nextRound
                };
            }

            return {
                ...state,
                currentRound: nextRound
            };

        case SET_PLAYER_NAME:
            let copy = [...state.players];
            copy[action.index] = { name: action.name };
            return { ...state, players: copy };

        case ADD_PLAYER:
            let apCopy = [...state.players].concat({ name: action.name });
            console.log("apCopy", apCopy);
            const apScores = { ...state.scores };
            apScores[state.players.length] = [0];
            return { ...state, players: apCopy, scores: apScores };

        case REMOVE_PLAYER:
            let rpCopy = [...state.players];
            rpCopy.splice(index, 1)
            return { ...state, players: rpCopy };

        case NEW_GAME:
            let newScores = {};
            state.players.forEach((name, index) => {
                newScores[index] = [0]
            })
            return {
                ...state,
                scores: newScores,
                currentRound: 0,
            };

        default:
            return state;
    }
};

export default currentGameReducer;