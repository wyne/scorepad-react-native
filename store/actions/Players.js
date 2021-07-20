export const SET_PLAYER_NAME = 'SET_PLAYER_NAME';

export const setPlayerName = (index, name) => {
    return { type: SET_PLAYER_NAME, index: index, name: name }
}