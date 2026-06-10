import { grandTotalScore, totalScoreBeforeRound } from './scoreUtils';

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
});
