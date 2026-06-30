import { PayloadAction, ThunkAction, UnknownAction, createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { getContrastRatio } from 'colorsheet';
import * as Crypto from 'expo-crypto';

import { logEvent } from '../src/Analytics';
import { getPalette } from '../src/ColorPalette';
import { InteractionType } from '../src/components/Interactions/InteractionType';
import { SortDirectionKey, SortSelectorKey } from '../src/components/ScoreLog/SortHelper';
import logger from '../src/Logger';

import { playerAdd, removePlayer, selectPlayerById, updatePlayer } from './PlayersSlice';
import { incrementRollingGameCounter, setCurrentGameId } from './SettingsSlice';
import { RootState } from './store';

export interface GameState {
    id: string;
    title: string;
    dateCreated: number;
    roundCurrent: number; // 0-indexed
    roundTotal: number; // count of visible rounds (>= 1), not an index
    playerIds: string[];
    locked?: boolean;
    winnerIds?: string[];
    sortSelectorKey?: SortSelectorKey;
    sortDirectionKey?: SortDirectionKey;
    palette?: string;
    // Per-game gesture. When unset, falls back to the global default
    // (settings.interactionType) via selectInteractionType.
    interactionType?: InteractionType;
}

const gamesAdapter = createEntityAdapter({
    sortComparer: (a: GameState, b: GameState) => (
        b.dateCreated - a.dateCreated || a.id.localeCompare(b.id)
    ),
});

const initialState = gamesAdapter.getInitialState({
});

export const gameDefaults = {
    roundCurrent: 0,
    roundTotal: 1,
    locked: false,
    winnerIds: [],
    sortSelectorKey: SortSelectorKey.ByScore,
    sortDirectionKey: SortDirectionKey.Normal,
    palette: 'original',
};

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
        setSortSelector(state, action: PayloadAction<{ gameId: string, sortSelector: SortSelectorKey; }>) {
            const game = state.entities[action.payload.gameId];

            if (!game) { return; }

            let newSortDirection = SortDirectionKey.Normal;

            // Toggle sort direction if the same sort selector is selected
            if (game.sortSelectorKey === action.payload.sortSelector) {
                newSortDirection = game.sortDirectionKey === SortDirectionKey.Normal ? SortDirectionKey.Reversed : SortDirectionKey.Normal;
            }

            gamesAdapter.updateOne(state, {
                id: game.id,
                changes: {
                    sortSelectorKey: action.payload.sortSelector,
                    sortDirectionKey: newSortDirection,
                }
            });
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
        },
        setGameInteractionType(state, action: PayloadAction<{ gameId: string, interactionType: InteractionType; }>) {
            const game = state.entities[action.payload.gameId];
            if (!game) { return; }

            gamesAdapter.updateOne(state, {
                id: action.payload.gameId,
                changes: {
                    interactionType: action.payload.interactionType,
                }
            });
        },
        restoreAllGames(state, action: PayloadAction<Record<string, GameState>>) {
            gamesAdapter.setAll(state, action.payload);
        },

    }
});

const { gameDelete } = gamesSlice.actions;

interface GamesSlice {
    games: typeof initialState;
}

export const deleteGameAndPlayers = (
    gameId: string
): ThunkAction<void, RootState, unknown, UnknownAction> => (dispatch, getState) => {
    const state = getState();
    const game = selectGameById(state, gameId);
    if (!game) return;

    const playerIdsUsedByOtherGames = new Set(
        Object.values(state.games.entities)
            .filter(otherGame => otherGame?.id !== gameId)
            .flatMap(otherGame => otherGame?.playerIds ?? [])
    );

    dispatch(gameDelete(gameId));
    game.playerIds
        .filter(playerId => !playerIdsUsedByOtherGames.has(playerId))
        .forEach(playerId => dispatch(removePlayer(playerId)));

    if (state.settings.currentGameId === gameId) {
        dispatch(setCurrentGameId(undefined));
    }
};

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
            ...gameDefaults,
            id: newGameId,
            title: game.title,
            dateCreated: Date.now(),
            playerIds: playerIds,
        }));

        dispatch(setCurrentGameId(newGameId));

        void logEvent('rematch_game', {
            game_id: game.id,
        });

        return newGameId;
    }
);

export const asyncSetGamePalette = createAsyncThunk(
    'games/setpalette',
    async (
        { gameId, palette }: { gameId: string, palette: string; },
        { dispatch, getState }
    ) => {
        // Update game
        dispatch(updateGame({
            id: gameId,
            changes: {
                palette: palette,
            }
        }));
        // Get palette colors
        const paletteColors = getPalette(palette);

        const game = selectGameById(getState() as RootState, gameId);

        // Update players
        game?.playerIds.forEach((playerId) => {
            const color = paletteColors[game.playerIds.indexOf(playerId) % paletteColors.length];
            dispatch(updatePlayer({
                id: playerId,
                changes: { color: color }
            }));
        });
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

        const paletteName = gameDefaults.palette;
        const paletteColors = getPalette(paletteName);

        playerIds.forEach((playerId, index) => {
            const color = paletteColors[index % paletteColors.length];
            dispatch(playerAdd({
                id: playerId,
                playerName: `Player ${playerIds.indexOf(playerId) + 1}`,
                scores: [0],
                color: color,
            }));
        });

        dispatch(gameSave({
            ...gameDefaults,
            id: newGameId,
            title: `Game ${gameCount + 1}`,
            dateCreated: Date.now(),
            playerIds: playerIds,
        }));

        dispatch(setCurrentGameId(newGameId));
        dispatch(incrementRollingGameCounter());

        void logEvent('new_game', {
            game_count: gameCount,
            player_count: playerCount,
        });

        return newGameId;
    }
);

export const addPlayer = createAsyncThunk(
    'games/addplayer',
    async (
        { gameId, playerName }: { gameId: string, playerName: string; },
        { dispatch, getState }
    ) => {
        const playerId = Crypto.randomUUID();
        const s = getState() as RootState;
        const paletteName = s.games.entities[gameId]?.palette;
        const palette = getPalette(paletteName || 'original');
        const playerIndex = s.games.entities[gameId]?.playerIds.length || 0;
        const paletteColor = palette[playerIndex % palette.length];

        dispatch(playerAdd({
            id: playerId,
            playerName: playerName,
            scores: [0],
            color: paletteColor,
        }));

        dispatch(updateGame({
            id: gameId,
            changes: {
                playerIds: [...selectGameById(getState() as RootState, gameId)?.playerIds || [], playerId],
            }
        }));

        return playerId;
    }
);

export const selectSortSelectorKey = (state: RootState, gameId: string) => {
    const key = selectGameById(state, gameId)?.sortSelectorKey;
    return key !== undefined ? key : SortSelectorKey.ByScore;
};

export const makeSelectPlayerColors = () => createSelector(
    [
        (state: RootState, gameId: string | undefined): GameState | undefined => {
            if (!gameId) {
                return undefined;
            }
            return state.games.entities[gameId];
        },
        (state: RootState, gameId: string | undefined, playerId: string): string => playerId,
        (state: RootState, gameId: string | undefined, playerId: string): string | undefined => state.players.entities[playerId]?.color,
    ],
    (game, playerId, playerColor) => {
        if (!game || !playerId) {
            return ['#000000', '#FFFFFF'];
        }

        const paletteName = game.palette;
        const playerIds = game.playerIds;

        const playerIndex = playerIds.indexOf(playerId);

        const palette = getPalette(paletteName || 'original') || getPalette('original');
        const paletteBG = palette[playerIndex % palette.length];

        const bg = playerColor || paletteBG;

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
    setSortSelector,
    reorderPlayers,
    setGameInteractionType,
    restoreAllGames,
} = gamesSlice.actions;

export default gamesSlice.reducer;

// Export the customized selectors for this adapter using `getSelectors`
export const {
    selectAll: selectAllGames,
    selectById: selectGameById,
    selectIds: selectGameIds
    // Pass in a selector that returns the posts slice of state
} = gamesAdapter.getSelectors((state: GamesSlice) => state.games);
