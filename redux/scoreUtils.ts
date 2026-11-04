/**
 * Coerce a stored scores value into a number array. Old persisted state or
 * imported backups can hold non-array values (e.g. `{ 0: 3 }`) or numbers
 * stored as strings, which would otherwise crash every `reduce` over them.
 */
export function toScores(scores: unknown): number[] {
    if (!Array.isArray(scores)) return [];
    return scores.map((score) => Number(score) || 0);
}

export function grandTotalScore(scores: unknown = []): number {
    return toScores(scores).reduce((total, score) => total + score, 0);
}

export function totalScoreBeforeRound(scores: unknown = [], roundIndex: number): number {
    return toScores(scores).reduce(
        (total, score, index) => (index < roundIndex ? total + score : total),
        0
    );
}
