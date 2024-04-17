import analytics from '@react-native-firebase/analytics';
import { PayloadAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { getContrastRatio } from 'colorsheet';
import * as Crypto from 'expo-crypto';

import { getPalette } from '../src/ColorPalette';
import logger from '../src/Logger';

import { ScoreState, playerAdd, selectAllPlayers, selectPlayerById } from './PlayersSlice';
import { setCurrentGameId } from './SettingsSlice';
import { RootState } from './store';

export interface GameState {
    id: string;
    title: string;
    dateCreated: number;
    roundCurrent: number;
    roundTotal: number;
    playerIds: string[];
    locked?: boolean;
    palette?: string;
}

const gamesAdapter = createEntityAdapter({
    sortComparer: (a: GameState, b: GameState) => (a.dateCreated < b.dateCreated) ? 1 : -1,
});

const initialState = gamesAdapter.getInitialState({
});

const gamesSlice = createSlice({
    name: 'games',
    initialState,
    reducers: {
        updateGame: gamesAdapter.updateOne,
        roundNext(state, action: PayloadAction<string>) {
            const game = state.entities[action.payload];
            if (!game) { return; }
            gamesAdapter.updateOne(state, {
                id: action.payload,
                changes: {
                    roundCurrent: game.roundCurrent + 1,
                    roundTotal: Math.max(game.roundTotal, game.roundCurrent + 2)
                }
            });
        },
        roundPrevious(state, action: PayloadAction<string>) {
            const game = state.entities[action.payload];
            if (!game) { return; }
            gamesAdapter.updateOne(state, {
                id: action.payload,
                changes: {
                    roundCurrent: Math.max(0, game.roundCurrent - 1),
                }
            });
        },
        gameSave(state, action: PayloadAction<GameState>) {
            gamesAdapter.upsertOne(state, action.payload);
        },
        gameDelete(state, action: PayloadAction<string>) {
            gamesAdapter.removeOne(state, action.payload);
        },
        reorderPlayers(state, action: PayloadAction<{ gameId: string, playerIds: string[]; }>) {
            const game = state.entities[action.payload.gameId];
            if (!game) { return; }

            gamesAdapter.updateOne(state, {
                id: action.payload.gameId,
                changes: {
                    playerIds: action.payload.playerIds,
                }
            });
        }
    }
});

interface GamesSlice {
    games: typeof initialState;
}

export const asyncRematchGame = createAsyncThunk(
    'games/rematch',
    async (
        { gameId }: { gameId: string; },
        { dispatch, getState }
    ) => {
        const newGameId = Crypto.randomUUID();

        const playerIds: string[] = [];

        const game = selectGameById(getState() as RootState, gameId);

        if (!game) {
            logger.error('No game found to rematch!');
            return;
        }

        game.playerIds.forEach(() => {
            playerIds.push(Crypto.randomUUID());
        });

        playerIds.forEach((playerId) => {
            const oldPlayerId = game.playerIds[playerIds.indexOf(playerId)];

            const player = selectPlayerById(getState() as RootState, oldPlayerId);
            const playerName = player?.playerName;

            dispatch(playerAdd({
                id: playerId,
                playerName: playerName || `Player ${playerIds.indexOf(playerId) + 1}`,
                scores: [0],
            }));
        });

        dispatch(gameSave({
            id: newGameId,
            title: game.title,
            dateCreated: Date.now(),
            roundCurrent: 0,
            roundTotal: 1,
            playerIds: playerIds,
        }));

        dispatch(setCurrentGameId(newGameId));

        await analytics().logEvent('rematch_game', {
            gameId: game.id,
        });

        return newGameId;
    }
);

export const asyncCreateGame = createAsyncThunk(
    'games/create',
    async (
        { gameCount, playerCount }: { gameCount: number, playerCount: number; },
        { dispatch }
    ) => {
        const newGameId = Crypto.randomUUID();

        const playerIds: string[] = [];
        for (let i = 0; i < playerCount; i++) {
            playerIds.push(Crypto.randomUUID());
        }

        playerIds.forEach((playerId) => {
            dispatch(playerAdd({
                id: playerId,
                playerName: `Player ${playerIds.indexOf(playerId) + 1}`,
                scores: [0],
            }));
        });

        dispatch(gameSave({
            id: newGameId,
            title: `Game ${gameCount + 1}`,
            dateCreated: Date.now(),
            roundCurrent: 0,
            roundTotal: 1,
            playerIds: playerIds,
        }));

        dispatch(setCurrentGameId(newGameId));

        await analytics().logEvent('new_game', {
            index: gameCount,
        });

        return newGameId;
    }
);

export const selectSortedPlayers = createSelector(
    [
        selectAllPlayers,
        (state: RootState) => state.settings.currentGameId ? state.games.entities[state.settings.currentGameId] : undefined
    ],
    (players: ScoreState[], currentGame: GameState | undefined) => {
        if (!currentGame) return [];

        return players.filter(player => currentGame.playerIds?.includes(player.id))
            .sort((a, b) => {
                if (currentGame?.playerIds == undefined) return 0;
                return currentGame.playerIds.indexOf(a.id) - currentGame.playerIds.indexOf(b.id);
            });
    }
);

const selectPaletteName = (state: RootState, gameId: string) => state.games.entities[gameId]?.palette;
const selectPlayerIndex = (_: RootState, __: string, playerIndex: number) => playerIndex;

export const selectPlayerColors = createSelector(
    [selectPaletteName, selectPlayerIndex],
    (paletteName, playerIndex) => {
        // TODO: Get player color if it exists

        const palette = getPalette(paletteName || 'original');

        const bg = palette[playerIndex % palette.length];

        const blackContrast = getContrastRatio(bg, '#000').number;
        const whiteContrast = getContrastRatio(bg, '#fff').number;

        // +1 to give a slight preference to white
        const fg = blackContrast >= whiteContrast + 1 ? '#000000' : '#FFFFFF';

        return [bg, fg];
    }
);

export const {
    updateGame,
    roundNext,
    roundPrevious,
    gameSave,
    gameDelete,
    reorderPlayers,
} = gamesSlice.actions;

export default gamesSlice.reducer;

// Export the customized selectors for this adapter using `getSelectors`
export const {
    selectAll: selectAllGames,
    selectById: selectGameById,
    selectIds: selectGameIds
    // Pass in a selector that returns the posts slice of state
} = gamesAdapter.getSelectors((state: GamesSlice) => state.games);
