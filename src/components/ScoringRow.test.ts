import { scoringShortSummary, scoringSummary } from './ScoringRow';

describe('scoring summaries', () => {
    it('describes free play', () => {
        expect(scoringSummary(undefined)).toBe('Free play');
        expect(scoringShortSummary(undefined)).toBe('Free play');
    });

    it('describes the winner alone when the players decide when it ends', () => {
        expect(scoringSummary({ winner: 'low' })).toBe('Lowest score wins');
        expect(scoringShortSummary({ winner: 'high' })).toBe('Highest wins');
    });

    it('adds a round limit or target score', () => {
        expect(scoringSummary({ winner: 'high', end: { type: 'rounds', rounds: 9 } })).toBe('Highest score wins · 9 rounds');
        expect(scoringShortSummary({ winner: 'high', end: { type: 'rounds', rounds: 1 } })).toBe('Highest wins · 1 round');
        expect(scoringShortSummary({ winner: 'low', end: { type: 'target', target: 100 } })).toBe('Lowest wins · ends at 100');
    });
});
