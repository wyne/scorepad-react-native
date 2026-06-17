export function grandTotalScore(scores: number[] = []): number {
    return scores.reduce((total, score) => total + (score || 0), 0);
}

export function totalScoreBeforeRound(scores: number[] = [], roundIndex: number): number {
    return scores.reduce(
        (total, score, index) => (index < roundIndex ? total + (score || 0) : total),
        0
    );
}
