export const INC_PLAYER_ROUND_SCORE = 'INC_PLAYER_ROUND_SCORE';
export const DEC_PLAYER_ROUND_SCORE = 'DEC_PLAYER_ROUND_SCORE';
export const NEXT_ROUND = 'NEXT_ROUND'
export const PREV_ROUND = 'PREV_ROUND'
export const SET_PLAYER_NAME = 'SET_PLAYER_NAME';
export const NEW_GAME = 'NEW_GAME';
export const ADD_PLAYER = 'ADD_PLAYER';
export const REMOVE_PLAYER = 'REMOVE_PLAYER';

export const incPlayerRoundScore = (index) => {
    return { type: INC_PLAYER_ROUND_SCORE, index: index, }
}

export const decPlayerRoundScore = (index) => {
    return { type: DEC_PLAYER_ROUND_SCORE, index: index, }
}

export const nextRound = (index, round) => {
    return { type: NEXT_ROUND }
}

export const prevRound = (index, round) => {
    return { type: PREV_ROUND }
}

export const setPlayerName = (index, name) => {
    return { type: SET_PLAYER_NAME, index: index, name: name }
}

export const newGame = () => {
    return { type: NEW_GAME }
}

export const addPlayer = (name) => {
    return { type: ADD_PLAYER, name: name }
}

export const removePlayer = (index) => {
    return { type: REMOVE_PLAYER, index: index }
}