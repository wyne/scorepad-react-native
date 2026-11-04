import * as Crypto from 'expo-crypto';

import { GameState, gameDefaults, restoreAllGames } from '../../../redux/GamesSlice';
import { restoreAllPlayers, ScoreState } from '../../../redux/PlayersSlice';
import { ScoringRules } from '../../../redux/ScoringRules';
import { incrementRollingGameCounter, setCurrentGameId } from '../../../redux/SettingsSlice';
import { AppDispatch } from '../../../redux/store';
import { getPalette } from '../../ColorPalette';

const MINUTE_MS = 60000;
const DAY_MS = 86400000;

interface GameSeed {
    title: string;
    /** How long before now the game was made. Spread out so the list shows
     * both day groups and every kind of date: "25m ago", "2d ago" with its
     * weekday, and a date from last year. */
    ageMs: number;
    /** Seat of the winner. Set, the game is finished (locked). */
    winner?: number;
    scoring?: ScoringRules;
    players: Array<{
        name: string;
        scores: number[];
    }>;
}

const GAMES_SEED_DATA: GameSeed[] = [
    {
        title: 'Smith Family Rummy',
        ageMs: 25 * MINUTE_MS,
        players: [
            { name: 'Morty', scores: [25, 0, 25, 43] },
            { name: 'Beth', scores: [0, 31, 0, 0] },
            { name: 'Summer', scores: [0, 0, 17, 22] },
            { name: 'Jerry', scores: [14, 18, 0, 12] },
        ],
    },
    {
        title: 'Gertrude\'s Parlour Scrabble',
        ageMs: 3 * 60 * MINUTE_MS,
        winner: 1,
        players: [
            { name: 'Carmen', scores: [28, 44, 19, 36, 52, 31] },
            { name: 'Gertrude', scores: [38, 57, 74, 22, 41, 66] },
            { name: 'Penelope', scores: [45, 18, 33, 61, 29, 48] },
        ],
    },
    {
        title: 'Dunder Mifflin Spades Night',
        ageMs: 2 * DAY_MS,
        winner: 1,
        players: [
            { name: 'Michael', scores: [110, -50, 120, 80] },
            { name: 'Dwight', scores: [150, 130, 120, 110] },
            { name: 'Jim', scores: [80, 100, -100, 90] },
            { name: 'Pam', scores: [90, 110, 70, 60] },
        ],
    },
    {
        // Long enough to wrap, and more players than the card's color stack holds.
        title: 'Thanksgiving Family Yahtzee Tournament',
        ageMs: 6 * DAY_MS,
        players: [
            { name: 'Aunt May', scores: [22, 31, 26] },
            { name: 'Ben', scores: [18, 24, 30] },
            { name: 'Cora', scores: [25, 19, 21] },
            { name: 'Dev', scores: [14, 28, 17] },
            { name: 'Eli', scores: [20, 16, 23] },
            { name: 'Fay', scores: [12, 22, 19] },
            { name: 'Gus', scores: [17, 13, 24] },
            { name: 'Hana', scores: [21, 18, 11] },
            { name: 'Ivan', scores: [9, 20, 15] },
        ],
    },
    {
        title: 'Friday Night Hearts',
        ageMs: 19 * DAY_MS,
        winner: 3,
        scoring: { winner: 'low' },
        players: [
            { name: 'Ivy', scores: [6, 13, 0, 26, 4] },
            { name: 'Ollie', scores: [13, 0, 26, 5, 9] },
            { name: 'Sam', scores: [2, 7, 0, 0, 13] },
            { name: 'Raj', scores: [5, 6, 0, 0, 0] },
        ],
    },
    {
        title: 'Holiday Cribbage',
        ageMs: 400 * DAY_MS,
        winner: 0,
        players: [
            { name: 'Grandpa', scores: [24, 31, 18, 29, 19] },
            { name: 'Kai', scores: [22, 26, 21, 17, 18] },
        ],
    },
];

export function loadSeedData(dispatch: AppDispatch) {
    const paletteColors = getPalette('original');

    const players: Record<string, ScoreState> = {};
    const games: Record<string, GameState> = {};

    const now = Date.now();

    GAMES_SEED_DATA.forEach(gameSpec => {
        const gameId = Crypto.randomUUID();
        const playerIds: string[] = [];

        gameSpec.players.forEach((playerData, playerIndex) => {
            const playerId = Crypto.randomUUID();
            const color = paletteColors[playerIndex % paletteColors.length];

            players[playerId] = {
                id: playerId,
                playerName: playerData.name,
                scores: [...playerData.scores],
                color,
            };
            playerIds.push(playerId);
        });

        games[gameId] = {
            ...gameDefaults,
            id: gameId,
            title: gameSpec.title,
            dateCreated: now - gameSpec.ageMs,
            roundCurrent: gameSpec.players[0].scores.length - 1,
            roundTotal: gameSpec.players[0].scores.length,
            playerIds,
            ...(gameSpec.winner !== undefined
                ? { locked: true, winnerIds: [playerIds[gameSpec.winner]] }
                : {}),
            ...(gameSpec.scoring ? { scoring: { ...gameSpec.scoring } } : {}),
        };
    });

    dispatch(restoreAllGames(games));
    dispatch(restoreAllPlayers(players));
    // The newest game, still in play.
    dispatch(setCurrentGameId(Object.keys(games)[0]));
    dispatch(incrementRollingGameCounter());
}
