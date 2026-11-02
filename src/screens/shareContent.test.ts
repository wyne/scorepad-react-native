import { GameState } from '../../redux/GamesSlice';
import { ScoreState } from '../../redux/PlayersSlice';

import { buildShareRows, buildShareText, describeGame, describeResult } from './shareContent';

const game = (overrides: Partial<GameState> = {}): GameState => ({
    id: 'g',
    title: 'Scrabble',
    dateCreated: new Date(2026, 10, 1, 12).getTime(),
    roundCurrent: 2,
    roundTotal: 3,
    playerIds: ['a', 'b', 'c'],
    ...overrides,
});

const players: Record<string, ScoreState> = {
    a: { id: 'a', playerName: 'Ann', scores: [10, 5, 1] },
    b: { id: 'b', playerName: 'Bob', scores: [20, 10] },
    c: { id: 'c', playerName: 'Cat', scores: [1, 2, 3] },
};

describe('buildShareRows', () => {
    it('orders players best first and fills missing rounds with 0', () => {
        const rows = buildShareRows(game(), players);
        expect(rows.map(r => [r.name, r.rank, r.total])).toEqual([
            ['Bob', '1', 30], ['Ann', '2', 16], ['Cat', '3', 6],
        ]);
        expect(rows[0].scores).toEqual([20, 10, 0]);
        expect(rows[0].color).toMatch(/^#/);
    });

    it('puts the lowest total first when low score wins', () => {
        const rows = buildShareRows(game({ scoring: { winner: 'low' } }), players);
        expect(rows[0].name).toBe('Cat');
    });

    it('marks ties and keeps seat order between them', () => {
        const tied = { ...players, c: { ...players.c, scores: [10, 5, 1] } };
        const rows = buildShareRows(game(), tied);
        expect(rows.map(r => [r.name, r.rank])).toEqual([['Bob', '1'], ['Ann', 'T2'], ['Cat', 'T2']]);
    });
});

describe('describeResult', () => {
    it('describes the leader of a game in progress with their margin', () => {
        const g = game();
        expect(describeResult(g, buildShareRows(g, players))).toEqual({
            winnerIds: ['b'], headline: 'Bob leads with 30', margin: 14,
        });
    });

    it('uses the picked winners of a finished game', () => {
        const g = game({ locked: true, winnerIds: ['a'] });
        const result = describeResult(g, buildShareRows(g, players));
        expect(result.winnerIds).toEqual(['a']);
        expect(result.headline).toBe('Ann wins with 16');
    });

    it('describes a tie for the lead', () => {
        const tied = { ...players, a: { ...players.a, scores: [30] } };
        const g = game();
        const result = describeResult(g, buildShareRows(g, tied));
        expect(result.headline).toBe('Ann and Bob tie at 30');
        expect(result.margin).toBeUndefined();
    });

    it('handles a game without players', () => {
        expect(describeResult(game({ playerIds: [] }), [])).toEqual({ winnerIds: [], headline: '' });
    });
});

describe('describeGame', () => {
    it('lists the date, rounds and players', () => {
        expect(describeGame(game())).toMatch(/· 3 rounds · 3 players$/);
        expect(describeGame(game({ roundTotal: 1, playerIds: ['a'] }))).toMatch(/· 1 round · 1 player$/);
    });
});

describe('buildShareText', () => {
    it('lists standings and round scores', () => {
        const g = game();
        const text = buildShareText(g, buildShareRows(g, players), { showRounds: true, showDetails: false });
        expect(text).toBe([
            'Scrabble',
            '',
            '1. Bob – 30',
            '2. Ann – 16',
            '3. Cat – 6',
            '',
            'Rounds',
            'Bob  20 10 0',
            'Ann  10 5 1',
            'Cat  1 2 3',
        ].join('\n'));
    });

    it('leaves out rounds and adds details when asked', () => {
        const g = game();
        const text = buildShareText(g, buildShareRows(g, players), { showRounds: false, showDetails: true });
        expect(text).not.toContain('Rounds');
        expect(text.split('\n')[1]).toContain('3 rounds');
    });
});
