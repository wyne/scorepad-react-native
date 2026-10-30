import {
    compareTotals,
    defaultScoringRules,
    gameOverReason,
    isScoringRules,
    leadingPlayerIds,
    rankLabel,
    rankPlayers,
} from './ScoringRules';

describe('ScoringRules', () => {
    describe('isScoringRules', () => {
        it('accepts both win conditions', () => {
            expect(isScoringRules({ winner: 'high' })).toBe(true);
            expect(isScoringRules({ winner: 'low' })).toBe(true);
        });

        it('rejects anything else', () => {
            expect(isScoringRules(undefined)).toBe(false);
            expect(isScoringRules(null)).toBe(false);
            expect(isScoringRules([])).toBe(false);
            expect(isScoringRules({})).toBe(false);
            expect(isScoringRules({ winner: 'middle' })).toBe(false);
        });

        it('accepts a round limit or a target score', () => {
            expect(isScoringRules({ winner: 'high', end: { type: 'rounds', rounds: 9 } })).toBe(true);
            expect(isScoringRules({ winner: 'low', end: { type: 'target', target: 100 } })).toBe(true);
        });

        it('rejects an end condition that is not a positive whole number', () => {
            expect(isScoringRules({ winner: 'high', end: { type: 'rounds', rounds: 0 } })).toBe(false);
            expect(isScoringRules({ winner: 'high', end: { type: 'rounds', rounds: 2.5 } })).toBe(false);
            expect(isScoringRules({ winner: 'high', end: { type: 'target', target: '100' } })).toBe(false);
            expect(isScoringRules({ winner: 'high', end: { type: 'forever' } })).toBe(false);
            expect(isScoringRules({ winner: 'high', end: null })).toBe(false);
        });
    });

    describe('gameOverReason', () => {
        const totals = [
            { id: 'a', total: 64 },
            { id: 'b', total: 104 },
            { id: 'c', total: 88 },
        ];

        it('never ends a game without an end condition', () => {
            expect(gameOverReason(undefined, 50, totals)).toBeUndefined();
            expect(gameOverReason({ winner: 'high' }, 50, totals)).toBeUndefined();
        });

        it('ends after the last round of a round limit', () => {
            const rules = { winner: 'high' as const, end: { type: 'rounds' as const, rounds: 9 } };
            expect(gameOverReason(rules, 8, totals)).toBeUndefined();
            expect(gameOverReason(rules, 9, totals)).toEqual({ type: 'rounds', rounds: 9 });
            expect(gameOverReason(rules, 10, totals)).toEqual({ type: 'rounds', rounds: 9 });
        });

        it('ends when anyone reaches the target, naming who reached it', () => {
            const rules = { winner: 'low' as const, end: { type: 'target' as const, target: 100 } };
            expect(gameOverReason(rules, 4, totals)).toEqual({ type: 'target', target: 100, playerIds: ['b'] });

            const lower = { ...rules, end: { type: 'target' as const, target: 88 } };
            expect(gameOverReason(lower, 4, totals)).toEqual({ type: 'target', target: 88, playerIds: ['b', 'c'] });

            const higher = { ...rules, end: { type: 'target' as const, target: 105 } };
            expect(gameOverReason(higher, 4, totals)).toBeUndefined();
        });
    });

    describe('compareTotals', () => {
        it('puts the higher total first by default', () => {
            expect(compareTotals(undefined, 10, 5)).toBeLessThan(0);
            expect(compareTotals(defaultScoringRules, 10, 5)).toBeLessThan(0);
        });

        it('puts the lower total first when lowest wins', () => {
            expect(compareTotals({ winner: 'low' }, 5, 10)).toBeLessThan(0);
            expect(compareTotals({ winner: 'low' }, 10, 5)).toBeGreaterThan(0);
        });
    });

    describe('leadingPlayerIds', () => {
        const totals = [
            { id: 'a', total: 12 },
            { id: 'b', total: 30 },
            { id: 'c', total: 12 },
        ];

        it('returns the highest total by default', () => {
            expect(leadingPlayerIds(undefined, totals)).toEqual(['b']);
        });

        it('returns every player tied for the lowest total when lowest wins', () => {
            expect(leadingPlayerIds({ winner: 'low' }, totals)).toEqual(['a', 'c']);
        });

        it('returns nothing without players', () => {
            expect(leadingPlayerIds({ winner: 'low' }, [])).toEqual([]);
        });
    });

    describe('rankPlayers', () => {
        const totals = [
            { id: 'a', total: 40 },
            { id: 'b', total: 25 },
            { id: 'c', total: 25 },
            { id: 'd', total: 10 },
        ];

        it('skips the place after a tie when highest wins', () => {
            const ranks = rankPlayers(undefined, totals);
            expect(ranks).toEqual({
                a: { rank: 1, tied: false },
                b: { rank: 2, tied: true },
                c: { rank: 2, tied: true },
                d: { rank: 4, tied: false },
            });
        });

        it('ranks the lowest total first when lowest wins', () => {
            const ranks = rankPlayers({ winner: 'low' }, totals);
            expect(ranks.d).toEqual({ rank: 1, tied: false });
            expect(ranks.b).toEqual({ rank: 2, tied: true });
            expect(ranks.a).toEqual({ rank: 4, tied: false });
        });

        it('labels ties with a T', () => {
            expect(rankLabel({ rank: 1, tied: false })).toBe('1');
            expect(rankLabel({ rank: 2, tied: true })).toBe('T2');
        });
    });
});
