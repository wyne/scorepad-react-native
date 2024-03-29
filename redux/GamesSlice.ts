import analytics from '@react-native-firebase/analytics';
import { createSlice, PayloadAction, createEntityAdapter, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import * as Crypto from 'expo-crypto';

import { ScoreState, playerAdd, selectAllPlayers } from './PlayersSlice';
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
        }
    }
});

interface GamesSlice {
    games: typeof initialState;
}

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

export const {
    updateGame,
    roundNext,
    roundPrevious,
    gameSave,
    gameDelete,
} = gamesSlice.actions;

export default gamesSlice.reducer;

// Export the customized selectors for this adapter using `getSelectors`
export const {
    selectAll: selectAllGames,
    selectById: selectGameById,
    selectIds: selectGameIds
    // Pass in a selector that returns the posts slice of state
} = gamesAdapter.getSelectors((state: GamesSlice) => state.games);
