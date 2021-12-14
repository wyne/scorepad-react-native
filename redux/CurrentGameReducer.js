import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import {
    INC_PLAYER_ROUND_SCORE,
    DEC_PLAYER_ROUND_SCORE,
    NEXT_ROUND, PREV_ROUND,
    SET_PLAYER_NAME, NEW_GAME,
    ADD_PLAYER,
    REMOVE_PLAYER
} from "./CurrentGameActions"

const initialState = {
    players: [
        { name: 'Player 1', uuid: uuidv4() },
        { name: 'Player 2', uuid: uuidv4() },
    ],
    scores: [
        [0],
        [0],
    ],
    currentRound: 0,
}

const currentGameReducer = (state = initialState, action) => {
    switch (action.type) {
        case INC_PLAYER_ROUND_SCORE:
            const incrementedPlayerScores = [...state.scores];
            incrementedPlayerScores[action.index][state.currentRound] =
                (incrementedPlayerScores[action.index][state.currentRound] || 0) + (action.multiplier || 1);
            return { ...state, scores: incrementedPlayerScores };

        case DEC_PLAYER_ROUND_SCORE:
            const decrementedPlayerScores = [...state.scores];
            decrementedPlayerScores[action.index][state.currentRound] =
                (decrementedPlayerScores[action.index][state.currentRound] || 0) - (action.multiplier || 1);
            return { ...state, scores: decrementedPlayerScores };

        case PREV_ROUND:
            if (state.currentRound - 1 < 0) {
                return state;
            } else {
                const prevRound = state.currentRound - 1;
                return { ...state, currentRound: prevRound };
            }

        case NEXT_ROUND:
            const nextRound = state.currentRound + 1;

            // TODO: clean up
            if (state.scores[0][nextRound] === undefined) {
                const copy = [...state.scores];

                state.players.forEach((name, index) => {
                    copy[index][nextRound] = 0;
                })
                return {
                    ...state,
                    scores: copy,
                    currentRound: nextRound
                };
            }

            return {
                ...state,
                currentRound: nextRound
            };

        case SET_PLAYER_NAME:
            let copy = [...state.players];
            copy[action.index] = { ...copy[action.index], name: action.name, };
            return { ...state, players: copy };

        case ADD_PLAYER:
            let apPlayers = [...state.players].concat({
                name: action.name,
                uuid: uuidv4()
            });
            const apScores = [...state.scores].concat([
                Array(state.scores[0].length).fill(0)
            ]);
            return { ...state, players: apPlayers, scores: apScores };

        case REMOVE_PLAYER:
            let rpCopy = [...state.players];
            rpCopy.splice(action.index, 1)

            const rpScores = [...state.scores];
            rpScores.splice(action.index, 1)
            return { ...state, players: rpCopy, scores: rpScores };

        case NEW_GAME:
            let newScores = [];
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