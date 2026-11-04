import { GameState, playerColorPair } from '../../redux/GamesSlice';
import { ScoreState } from '../../redux/PlayersSlice';
import { grandTotalScore } from '../../redux/scoreUtils';
import { compareTotals, leadingPlayerIds, rankLabel, rankPlayers } from '../../redux/ScoringRules';

export type ShareFormat = 'scoreboard' | 'standings' | 'winner';

export interface ShareRow {
    id: string;
    name: string;
    /** "1", or "T2" for a tie. */
    rank: string;
    total: number;
    /** One score per round, 0 where a round has no score. */
    scores: number[];
    color: string;
    textColor: string;
}

export interface ShareResult {
    /** Players shown as the winners (or leaders, while the game is going). */
    winnerIds: string[];
    /** One line about the result, e.g. "Gertrude wins with 298". */
    headline: string;
    /** How far ahead a sole winner is of the next player, when there is one. */
    margin?: number;
}

/** The game's players in finishing order, best first, seat order for ties. */
export const buildShareRows = (
    game: GameState,
    players: Record<string, ScoreState | undefined>,
): ShareRow[] => {
    const totals = game.playerIds.map(id => ({ id, total: grandTotalScore(players[id]?.scores) }));
    const ranks = rankPlayers(game.scoring, totals);

    return game.playerIds
        .map((id, seat) => ({ id, seat, total: totals[seat].total }))
        .sort((a, b) => compareTotals(game.scoring, a.total, b.total) || a.seat - b.seat)
        .map(({ id, total }) => {
            const player = players[id];
            const [color, textColor] = playerColorPair(game, id, player?.color);
            return {
                id,
                name: player?.playerName ?? '',
                rank: rankLabel(ranks[id]),
                total,
                scores: [...Array(game.roundTotal).keys()].map(round => player?.scores[round] || 0),
                color,
                textColor,
            };
        });
};

const joinNames = (names: string[]): string => {
    if (names.length <= 2) return names.join(' and ');
    return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
};

/**
 * Who won a finished game (the winners picked when it ended), or who leads one
 * still going. A game finished without picking winners has none: its scores
 * are final, and the score leader isn't crowned in their place.
 */
export const describeResult = (game: GameState, rows: ShareRow[]): ShareResult => {
    if (rows.length === 0) return { winnerIds: [], headline: '' };

    const finished = !!game.locked;
    const winnerIds = finished
        ? rows.filter(row => game.winnerIds?.includes(row.id)).map(row => row.id)
        : leadingPlayerIds(game.scoring, rows);
    if (winnerIds.length === 0) return { winnerIds: [], headline: 'Final scores' };

    const winners = rows.filter(row => winnerIds.includes(row.id));
    const names = joinNames(winners.map(row => row.name));
    const total = winners[0]?.total ?? 0;

    if (winners.length > 1) {
        const allSame = winners.every(row => row.total === total);
        const verb = finished ? 'win' : 'lead';
        return { winnerIds, headline: allSame ? `${names} tie at ${total}` : `${names} ${verb}` };
    }

    const runnerUp = rows.find(row => !winnerIds.includes(row.id));
    const margin = runnerUp ? Math.abs(total - runnerUp.total) : undefined;
    return {
        winnerIds,
        headline: `${names} ${finished ? 'wins' : 'leads'} with ${total}`,
        margin: margin ? margin : undefined,
    };
};

/** "Sun, Nov 1 · 6 rounds · 3 players" */
export const describeGame = (game: GameState): string => {
    const date = new Date(game.dateCreated).toLocaleDateString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric',
    });
    const rounds = `${game.roundTotal} ${game.roundTotal === 1 ? 'round' : 'rounds'}`;
    const players = `${game.playerIds.length} ${game.playerIds.length === 1 ? 'player' : 'players'}`;
    return `${date} · ${rounds} · ${players}`;
};

export interface ShareOptions {
    format: ShareFormat;
    showRounds: boolean;
    showDetails: boolean;
    showResult: boolean;
}

/**
 * The share card as plain text, for pasting into a chat: the same format and
 * options as the image. Winners are marked in the standings, so a winner
 * picked by hand shows even when they aren't first on points.
 */
export const buildShareText = (
    game: GameState,
    rows: ShareRow[],
    result: ShareResult,
    options: ShareOptions,
): string => {
    const lines = [game.title];
    if (options.showDetails) lines.push(describeGame(game));

    // The Winner card is the result, so it always leads with it.
    const showResult = options.format === 'winner' || options.showResult;
    if (showResult && result.headline !== '') {
        const margin = result.margin != null ? ` (+${result.margin})` : '';
        lines.push('', `${result.headline}${margin}`);
    }

    lines.push('');
    rows.forEach(row => {
        const crown = showResult && result.winnerIds.includes(row.id) ? ' 🏆' : '';
        lines.push(`${row.rank}. ${row.name} – ${row.total}${crown}`);
    });

    if (options.format === 'scoreboard' && options.showRounds && game.roundTotal > 1) {
        const width = Math.max(...rows.map(row => row.name.length));
        lines.push('', 'Rounds');
        rows.forEach(row => lines.push(`${row.name.padEnd(width)}  ${row.scores.join(' ')}`));
    }

    return lines.join('\n');
};
