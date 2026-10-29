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

export interface ScoringRules {
    winner: WinCondition;
}

/** How every game without rules plays: highest total wins. */
export const defaultScoringRules: ScoringRules = {
    winner: 'high',
};

const winConditions: WinCondition[] = ['high', 'low'];

export const isScoringRules = (value: unknown): value is ScoringRules => (
    typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && winConditions.includes((value as Record<string, unknown>).winner as WinCondition)
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
