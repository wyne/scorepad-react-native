import { grandTotalScore, toScores, totalScoreBeforeRound } from './scoreUtils';

describe('scoreUtils', () => {
    describe('grandTotalScore', () => {
        it('should add all scores', () => {
            expect(grandTotalScore([2, -1, 4])).toBe(5);
        });

        it('should handle empty or missing scores', () => {
            expect(grandTotalScore()).toBe(0);
            expect(grandTotalScore([])).toBe(0);
        });
    });

    describe('totalScoreBeforeRound', () => {
        it('should add scores before the requested round', () => {
            expect(totalScoreBeforeRound([3, 4, 5], 2)).toBe(7);
        });

        it('should return zero for the first round', () => {
            expect(totalScoreBeforeRound([3, 4, 5], 0)).toBe(0);
        });
    });

    describe('malformed stored scores', () => {
        it('treats non-array scores as empty', () => {
            expect(toScores({ 0: 3 })).toEqual([]);
            expect(toScores(null)).toEqual([]);
            expect(grandTotalScore({ 0: 3 })).toBe(0);
            expect(totalScoreBeforeRound('12', 1)).toBe(0);
        });

        it('coerces numeric strings and junk entries', () => {
            expect(toScores(['3', null, 'x', 4])).toEqual([3, 0, 0, 4]);
            expect(grandTotalScore(['3', 4])).toBe(7);
        });
    });
});
