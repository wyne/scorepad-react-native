import * as Crypto from 'expo-crypto';

import { GameState, gameDefaults, restoreAllGames } from '../../../redux/GamesSlice';
import { restoreAllPlayers, ScoreState } from '../../../redux/PlayersSlice';
import { incrementRollingGameCounter, setCurrentGameId } from '../../../redux/SettingsSlice';
import { AppDispatch } from '../../../redux/store';
import { getPalette } from '../../ColorPalette';

interface GameSeed {
    title: string;
    players: Array<{
        name: string;
        scores: number[];
    }>;
}

const GAMES_SEED_DATA: GameSeed[] = [
    {
        title: 'Smith Family Rummy',
        players: [
            { name: 'Morty', scores: [25, 0, 25, 43] },
            { name: 'Beth', scores: [0, 31, 0, 0] },
            { name: 'Summer', scores: [0, 0, 17, 22] },
            { name: 'Jerry', scores: [14, 18, 0, 12] },
        ],
    },
    {
        title: "Gertrude's Parlour Scrabble",
        players: [
            { name: 'Carmen', scores: [28, 44, 19, 36, 52, 31] },
            { name: 'Gertrude', scores: [38, 57, 74, 22, 41, 66] },
            { name: 'Penelope', scores: [45, 18, 33, 61, 29, 48] },
        ],
    },
    {
        title: 'Dunder Mifflin Spades Night',
        players: [
            { name: 'Michael', scores: [110, -50, 120, 80] },
            { name: 'Dwight', scores: [150, 130, 120, 110] },
            { name: 'Jim', scores: [80, 100, -100, 90] },
            { name: 'Pam', scores: [90, 110, 70, 60] },
        ],
    },
];

export function loadSeedData(dispatch: AppDispatch) {
    const paletteColors = getPalette('original');

    const players: Record<string, ScoreState> = {};
    const games: Record<string, GameState> = {};

    const baseTime = Date.now() - GAMES_SEED_DATA.length * 86400000;

    GAMES_SEED_DATA.forEach((gameSpec, gameIndex) => {
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
            dateCreated: baseTime + gameIndex * 86400000,
            roundCurrent: gameSpec.players[0].scores.length - 1,
            roundTotal: gameSpec.players[0].scores.length,
            playerIds,
        };
    });

    dispatch(restoreAllGames(games));
    dispatch(restoreAllPlayers(players));
    dispatch(setCurrentGameId(Object.keys(games)[0]));
    dispatch(incrementRollingGameCounter());
}
