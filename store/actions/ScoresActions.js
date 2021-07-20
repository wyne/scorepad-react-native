export const INC_PLAYER_ROUND_SCORE = 'INC_PLAYER_ROUND_SCORE';
export const DEC_PLAYER_ROUND_SCORE = 'DEC_PLAYER_ROUND_SCORE';
export const NEXT_ROUND = 'NEXT_ROUND'
export const PREV_ROUND = 'PREV_ROUND'

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