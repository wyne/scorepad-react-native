import * as Crypto from 'expo-crypto';

import { GameState, gameDefaults, restoreAllGames } from '../../../redux/GamesSlice';
import { restoreAllPlayers, ScoreState } from '../../../redux/PlayersSlice';
import { incrementRollingGameCounter, setCurrentGameId } from '../../../redux/SettingsSlice';
import { AppDispatch } from '../../../redux/store';
import { getPalette } from '../../ColorPalette';
import { SortDirectionKey, SortSelectorKey } from '../ScoreLog/SortHelper';

const RICK_AND_MORTY_CHARACTERS = [
    'Rick Sanchez',
    'Morty Smith',
    'Summer Smith',
    'Jerry Smith',
    'Beth Smith',
    'Birdperson',
    'Squanchy',
    'Mr. Meeseeks',
    'Mr. Poopybutthole',
    'King Flippy Nips',
    'Krombopulos Michael',
    'Scary Terry',
    'Abrodolph Lincoler',
    'Gearhead',
    'Revolio Clockberg Jr.',
    'Tammy Guetermann',
    'Bradford',
    'Jessica',
    'Frank Palicky',
    'Dr. Xenon Bloom',
];

const GAMES_SEED_DATA: Array<{ title: string; players: number; seed: number; }> = [
    { title: 'Council of Ricks', players: 5, seed: 42 },
    { title: 'Smith Family Game Night', players: 4, seed: 17 },
    { title: 'Interdimensional Customs', players: 6, seed: 99 },
];

function seededShuffle<T>(array: T[], seed: number): T[] {
    const result = [...array];
    let m = result.length;
    while (m) {
        m -= 1;
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        const i = seed % (m + 1);
        [result[m], result[i]] = [result[i], result[m]];
    }
    return result;
}

function seededRandom(seed: number): number {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
}

export function loadSeedData(dispatch: AppDispatch) {
    const paletteColors = getPalette('original');

    const players: Record<string, ScoreState> = {};

    const games: Record<string, GameState> = {};

    const baseTime = Date.now() - GAMES_SEED_DATA.length * 86400000;

    GAMES_SEED_DATA.forEach((gameSpec, gameIndex) => {
        const gameId = Crypto.randomUUID();
        const playerIds: string[] = [];
        const shuffled = seededShuffle(RICK_AND_MORTY_CHARACTERS, gameSpec.seed);
        const selectedPlayers = shuffled.slice(0, gameSpec.players);

        selectedPlayers.forEach((name, playerIndex) => {
            const playerId = Crypto.randomUUID();
            const color = paletteColors[playerIndex % paletteColors.length];

            const scores: number[] = [];
            const numRounds = 3;
            for (let round = 0; round < numRounds; round++) {
                const base = seededRandom(gameSpec.seed + playerIndex * 10 + round);
                const score = Math.round(base * 4 + 1);
                scores.push(score);
            }

            players[playerId] = {
                id: playerId,
                playerName: name,
                scores,
                color,
            };
            playerIds.push(playerId);
        });

        games[gameId] = {
            ...gameDefaults,
            id: gameId,
            title: gameSpec.title,
            dateCreated: baseTime + gameIndex * 86400000,
            roundCurrent: 2,
            roundTotal: 3,
            playerIds,
        };
    });

    dispatch(restoreAllGames(games));
    dispatch(restoreAllPlayers(players));
    dispatch(setCurrentGameId(Object.keys(games)[0]));
    dispatch(incrementRollingGameCounter());
}
