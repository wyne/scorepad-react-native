import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createEntityAdapter } from '@reduxjs/toolkit';
import { createAsyncThunk } from '@reduxjs/toolkit';
import * as Crypto from 'expo-crypto';

import analytics from '@react-native-firebase/analytics';
import { playerAdd } from './PlayersSlice';
import { setCurrentGameId } from './SettingsSlice';

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
                    roundTotal: Math.max(game.roundTotal, game.roundCurrent + 1)
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
    async (gameCount: number, { dispatch }) => {
        const player1Id = Crypto.randomUUID();
        const player2Id = Crypto.randomUUID();
        const newGameId = Crypto.randomUUID();

        dispatch(playerAdd({
            id: player1Id,
            playerName: "Player 1",
            scores: [0],
        }));

        dispatch(playerAdd({
            id: player2Id,
            playerName: "Player 2",
            scores: [0],
        }));

        dispatch(gameSave({
            id: newGameId,
            title: `Game ${gameCount}`,
            dateCreated: Date.now(),
            roundCurrent: 0,
            roundTotal: 0,
            playerIds: [player1Id, player2Id],
        }));

        dispatch(setCurrentGameId(newGameId));

        await analytics().logEvent('new_game', {
            index: gameCount,
        });

        return newGameId;
    }
);

export const {
    updateGame,
    roundNext,
    roundPrevious,
    gameSave,
    gameDelete
} = gamesSlice.actions;

export default gamesSlice.reducer;

// Export the customized selectors for this adapter using `getSelectors`
export const {
    selectAll: selectAllGames,
    selectById: selectGameById,
    selectIds: selectGameIds
    // Pass in a selector that returns the posts slice of state
} = gamesAdapter.getSelectors((state: GamesSlice) => state.games);
