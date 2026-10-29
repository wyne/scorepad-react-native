import { compareTotals, defaultScoringRules, isScoringRules, leadingPlayerIds, rankLabel, rankPlayers } from './ScoringRules';

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
