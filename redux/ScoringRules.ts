/**
 * How a game is scored and won (game modes).
 *
 * A game stores its own copy of these rules, so later changes to a named
 * preset never rewrite games that already exist. Screens read the rules,
 * never which named game they came from, so a preset and a hand-made custom
 * setup take the same path. New mechanics (end conditions, bids) are added
 * here as optional fields.
 */

export type WinCondition = 'high' | 'low';

/**
 * When a game is over. Unset means the players decide (free play). A round
 * limit ends the game after that many rounds; a target ends it when anyone's
 * total reaches the target at the end of a round.
 */
export type EndCondition =
    | { type: 'rounds'; rounds: number; }
    | { type: 'target'; target: number; };

export interface ScoringRules {
    winner: WinCondition;
    end?: EndCondition;
}

/** How every game without rules plays: highest total wins. */
export const defaultScoringRules: ScoringRules = {
    winner: 'high',
};

const winConditions: WinCondition[] = ['high', 'low'];

/** Limits for the Scoring Rules inputs, and for restored backups. */
export const MAX_ROUND_LIMIT = 999;
export const MAX_TARGET_SCORE = 999999;

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
);

const isWholeNumberIn = (value: unknown, min: number, max: number): boolean => (
    typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max
);

export const isEndCondition = (value: unknown): value is EndCondition => {
    if (!isRecord(value)) return false;
    if (value.type === 'rounds') return isWholeNumberIn(value.rounds, 1, MAX_ROUND_LIMIT);
    if (value.type === 'target') return isWholeNumberIn(value.target, 1, MAX_TARGET_SCORE);
    return false;
};

export const isScoringRules = (value: unknown): value is ScoringRules => (
    isRecord(value)
    && winConditions.includes(value.winner as WinCondition)
    && (value.end === undefined || isEndCondition(value.end))
);

export const scoringRulesOrDefault = (rules: ScoringRules | undefined): ScoringRules => (
    rules ?? defaultScoringRules
);

/**
 * Compares two totals so the better one sorts first: a negative result
 * means `a` is ahead of `b` under the rules.
 */
export const compareTotals = (rules: ScoringRules | undefined, a: number, b: number): number => (
    scoringRulesOrDefault(rules).winner === 'low' ? a - b : b - a
);

/**
 * The ids of the players currently in the lead, ties included. Empty when
 * there are no players.
 */
export const leadingPlayerIds = (
    rules: ScoringRules | undefined,
    totals: { id: string; total: number; }[],
): string[] => {
    if (totals.length === 0) return [];

    const best = totals.reduce(
        (lead, player) => (compareTotals(rules, player.total, lead) < 0 ? player.total : lead),
        totals[0].total,
    );

    return totals.filter(player => player.total === best).map(player => player.id);
};

export interface PlayerRank {
    rank: number;
    tied: boolean;
}

/**
 * Standings under the rules, using standard competition ranking: tied
 * players share a place and the next place is skipped (1, 2, 2, 4).
 */
export const rankPlayers = (
    rules: ScoringRules | undefined,
    totals: { id: string; total: number; }[],
): Record<string, PlayerRank> => {
    const sorted = [...totals].sort((a, b) => compareTotals(rules, a.total, b.total));
    const countByTotal = new Map<number, number>();
    totals.forEach(({ total }) => countByTotal.set(total, (countByTotal.get(total) ?? 0) + 1));

    const ranks: Record<string, PlayerRank> = {};
    sorted.forEach((player, index) => {
        const previous = sorted[index - 1];
        const rank = previous && previous.total === player.total
            ? ranks[previous.id].rank
            : index + 1;
        ranks[player.id] = { rank, tied: (countByTotal.get(player.total) ?? 0) > 1 };
    });

    return ranks;
};

/** A place as the score sheet shows it: "1", or "T2" for a tie. */
export const rankLabel = ({ rank, tied }: PlayerRank): string => `${tied ? 'T' : ''}${rank}`;

/** Why a game is over, for the game over sheet. */
export type GameOverReason =
    | { type: 'rounds'; rounds: number; }
    | { type: 'target'; target: number; playerIds: string[]; };

/**
 * Whether the game is over once the given round is finished. `roundsPlayed`
 * counts the finished round (1 after the first round). Returns why, or
 * undefined while play goes on or the game has no end condition.
 */
export const gameOverReason = (
    rules: ScoringRules | undefined,
    roundsPlayed: number,
    totals: { id: string; total: number; }[],
): GameOverReason | undefined => {
    const end = rules?.end;
    if (!end) return undefined;

    if (end.type === 'rounds') {
        return roundsPlayed >= end.rounds ? { type: 'rounds', rounds: end.rounds } : undefined;
    }

    const reached = totals.filter(({ total }) => total >= end.target).map(({ id }) => id);
    return reached.length > 0 ? { type: 'target', target: end.target, playerIds: reached } : undefined;
};
