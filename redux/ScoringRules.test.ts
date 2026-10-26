import { compareTotals, defaultScoringRules, isScoringRules, leadingPlayerIds } from './ScoringRules';

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
});
