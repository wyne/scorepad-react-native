import { InteractionType } from '../src/components/Interactions/InteractionType';
import { MAX_TILE_PLAYERS } from '../src/constants';

import gamesReducer, { gameSave, selectAllGames } from './GamesSlice';
import {
  selectInteractionType,
  selectIsDialOnly,
  selectCurrentGame,
  selectCurrentGameOverReason,
  selectGameModesVisible,
  selectLastStoreReviewPrompt,
  selectRecentPlayerNames,
} from './selectors';
import { RootState } from './store';

// Mock data for testing
const mockState: Partial<RootState> = {
  settings: {
    multiplier: 1,
    addendOne: 1,
    addendTwo: 10,
    currentGameId: 'game-1',
    showPointParticles: true,
    showPlayerIndex: true,
    interactionType: InteractionType.SwipeVertical,
    lastStoreReviewPrompt: 1234567890,
    appOpens: 1,
    installId: 'test-install-id',
    keepScreenAwake: false,
    seenFeatureNotifications: [],
    colorScheme: 'system',
    home_fullscreen: false,
  },
  games: {
    entities: {
      'game-1': {
        id: 'game-1',
        title: 'Test Game',
        dateCreated: Date.now(),
        roundCurrent: 0,
        roundTotal: 1,
        playerIds: ['player-1'],
      },
    },
    ids: ['game-1'],
  },
  players: {
    entities: {},
    ids: [],
  },
};

describe('Redux selectors', () => {
  describe('selectInteractionType', () => {
    it('should return valid interaction type from state', () => {
      const state = mockState as RootState;
      const result = selectInteractionType(state);
      expect(result).toBe(InteractionType.SwipeVertical);
    });

    it('should return default interaction type for invalid value', () => {
      const state = {
        ...mockState,
        settings: {
          ...mockState.settings!,
          interactionType: 'InvalidType' as InteractionType,
        },
      } as RootState;
      
      const result = selectInteractionType(state);
      expect(result).toBe(InteractionType.SwipeVertical);
    });

    it('should handle all valid interaction types', () => {
      Object.values(InteractionType).forEach(interactionType => {
        const state = {
          ...mockState,
          settings: {
            ...mockState.settings!,
            interactionType,
          },
        } as RootState;

        const result = selectInteractionType(state);
        expect(result).toBe(interactionType);
      });
    });

    it('should prefer the game-level interaction type over the global default', () => {
      const state = {
        ...mockState,
        settings: {
          ...mockState.settings!,
          interactionType: InteractionType.SwipeVertical,
        },
        games: {
          ...mockState.games!,
          entities: {
            'game-1': {
              ...mockState.games!.entities['game-1']!,
              interactionType: InteractionType.Dial,
            },
          },
        },
      } as RootState;

      expect(selectInteractionType(state, 'game-1')).toBe(InteractionType.Dial);
    });

    it('should use the Dial for games with more players than the tile board fits', () => {
      const state = {
        ...mockState,
        games: {
          ...mockState.games!,
          entities: {
            'game-1': {
              ...mockState.games!.entities['game-1']!,
              interactionType: InteractionType.HalfTap,
              playerIds: Array.from({ length: MAX_TILE_PLAYERS + 1 }, (_, i) => `player-${i}`),
            },
          },
        },
      } as RootState;

      expect(selectIsDialOnly(state, 'game-1')).toBe(true);
      expect(selectInteractionType(state, 'game-1')).toBe(InteractionType.Dial);
    });

    it('should keep the saved gesture for games at the tile board limit', () => {
      const state = {
        ...mockState,
        games: {
          ...mockState.games!,
          entities: {
            'game-1': {
              ...mockState.games!.entities['game-1']!,
              interactionType: InteractionType.HalfTap,
              playerIds: Array.from({ length: MAX_TILE_PLAYERS }, (_, i) => `player-${i}`),
            },
          },
        },
      } as RootState;

      expect(selectIsDialOnly(state, 'game-1')).toBe(false);
      expect(selectInteractionType(state, 'game-1')).toBe(InteractionType.HalfTap);
    });

    it('should fall back to the global default when the game has no interaction type', () => {
      const state = {
        ...mockState,
        settings: {
          ...mockState.settings!,
          interactionType: InteractionType.HalfTap,
        },
      } as RootState;

      // game-1 has no interactionType set
      expect(selectInteractionType(state, 'game-1')).toBe(InteractionType.HalfTap);
    });

    it('should fall back to the global default when no gameId is provided', () => {
      const state = {
        ...mockState,
        settings: {
          ...mockState.settings!,
          interactionType: InteractionType.HalfTap,
        },
        games: {
          ...mockState.games!,
          entities: {
            'game-1': {
              ...mockState.games!.entities['game-1']!,
              interactionType: InteractionType.Dial,
            },
          },
        },
      } as RootState;

      expect(selectInteractionType(state)).toBe(InteractionType.HalfTap);
    });
  });

  describe('selectCurrentGame', () => {
    it('should return current game when ID exists', () => {
      const state = mockState as RootState;
      const result = selectCurrentGame(state);
      
      expect(result).toEqual({
        id: 'game-1',
        title: 'Test Game',
        dateCreated: expect.any(Number),
        roundCurrent: 0,
        roundTotal: 1,
        playerIds: ['player-1'],
      });
    });

    it('should return undefined when current game ID is null', () => {
      const state = {
        ...mockState,
        settings: {
          ...mockState.settings!,
          currentGameId: undefined,
        },
      } as RootState;
      
      const result = selectCurrentGame(state);
      expect(result).toBeUndefined();
    });

    it('should return undefined when current game ID does not exist', () => {
      const state = {
        ...mockState,
        settings: {
          ...mockState.settings!,
          currentGameId: 'non-existent-game',
        },
      } as RootState;
      
      const result = selectCurrentGame(state);
      expect(result).toBeUndefined();
    });

  });

  describe('selectLastStoreReviewPrompt', () => {
    it('should return last store review prompt timestamp', () => {
      const state = mockState as RootState;
      const result = selectLastStoreReviewPrompt(state);
      expect(result).toBe(1234567890);
    });

    it('should return different timestamp value', () => {
      const state = {
        ...mockState,
        settings: {
          ...mockState.settings!,
          lastStoreReviewPrompt: 9876543210,
        },
      } as RootState;
      
      const result = selectLastStoreReviewPrompt(state);
      expect(result).toBe(9876543210);
    });
  });

  describe('selectGameModesVisible', () => {
    const withGame = (gameModesEnabled: boolean, scoring?: { winner: 'high' | 'low' }) => ({
      ...mockState,
      settings: { ...mockState.settings!, gameModesEnabled },
      games: {
        entities: { 'game-1': { ...mockState.games!.entities['game-1']!, scoring } },
        ids: ['game-1'],
      },
    }) as RootState;

    it('shows modes for any game while the flag is on', () => {
      expect(selectGameModesVisible(withGame(true), 'game-1')).toBe(true);
      expect(selectGameModesVisible(withGame(true))).toBe(true);
    });

    it('hides modes for games without rules while the flag is off', () => {
      expect(selectGameModesVisible(withGame(false), 'game-1')).toBe(false);
      expect(selectGameModesVisible(withGame(false))).toBe(false);
    });

    it('keeps modes for a game that has rules after the flag is turned off', () => {
      expect(selectGameModesVisible(withGame(false, { winner: 'low' }), 'game-1')).toBe(true);
    });
  });

  describe('selectCurrentGameOverReason', () => {
    const withRound = (
      roundCurrent: number,
      roundTotal: number,
      changes: { locked?: boolean; scoring?: RootState['games']['entities'][string]['scoring'] } = {},
    ) => ({
      ...mockState,
      games: {
        entities: {
          'game-1': {
            ...mockState.games!.entities['game-1']!,
            roundCurrent,
            roundTotal,
            playerIds: ['player-1', 'player-2'],
            scoring: { winner: 'high', end: { type: 'rounds', rounds: 3 } },
            ...changes,
          },
        },
        ids: ['game-1'],
      },
      players: {
        entities: {
          'player-1': { id: 'player-1', playerName: 'A', scores: [10, 20, 30] },
          'player-2': { id: 'player-2', playerName: 'B', scores: [5, 5, 5] },
        },
        ids: ['player-1', 'player-2'],
      },
    }) as RootState;

    it('is over once the last round of the limit is the latest round', () => {
      expect(selectCurrentGameOverReason(withRound(1, 2))).toBeUndefined();
      expect(selectCurrentGameOverReason(withRound(2, 3))).toEqual({ type: 'rounds', rounds: 3 });
    });

    it('never ends while stepping through an earlier round', () => {
      expect(selectCurrentGameOverReason(withRound(2, 5))).toBeUndefined();
    });

    it('is not over for a locked game or a game without an end condition', () => {
      expect(selectCurrentGameOverReason(withRound(2, 3, { locked: true }))).toBeUndefined();
      expect(selectCurrentGameOverReason(withRound(2, 3, { scoring: { winner: 'high' } }))).toBeUndefined();
    });

    it('uses the totals for a target score', () => {
      const scoring = { winner: 'high' as const, end: { type: 'target' as const, target: 60 } };
      expect(selectCurrentGameOverReason(withRound(0, 1, { scoring }))).toEqual({
        type: 'target',
        target: 60,
        playerIds: ['player-1'],
      });
    });
  });
});

describe('selectRecentPlayerNames', () => {
  const game = (id: string, dateCreated: number, playerIds: string[]) => ({
    id,
    title: id,
    dateCreated,
    roundCurrent: 0,
    roundTotal: 1,
    playerIds,
  });
  const player = (id: string, playerName: string) => ({ id, playerName, scores: [] });

  const state = {
    // Insert oldest first; the adapter maintains newest-first ordering.
    games: gamesReducer(
      gamesReducer(undefined, gameSave(game('old', 1000, ['p1', 'p2', 'p3']))),
      gameSave(game('new', 2000, ['p4', 'p5', 'p6']))
    ),
    players: {
      ids: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'],
      entities: {
        p1: player('p1', 'Alice'),
        p2: player('p2', 'Bob'),
        p3: player('p3', 'Player 3'),
        p4: player('p4', 'Carol'),
        p5: player('p5', 'Alice'),
        p6: player('p6', 'Player 2'),
      },
    },
  } as unknown as RootState;

  it('orders names by most recent game, then seat order', () => {
    expect(selectRecentPlayerNames(state)).toEqual(['Carol', 'Alice', 'Bob']);
  });

  it('lists each name once and leaves out default player names', () => {
    const names = selectRecentPlayerNames(state);
    expect(names.filter((name) => name === 'Alice')).toHaveLength(1);
    expect(names).not.toContain('Player 2');
    expect(names).not.toContain('Player 3');
  });

  it('returns a stable memoized reference', () => {
    expect(selectRecentPlayerNames(state)).toBe(selectRecentPlayerNames(state));
  });

  it('updates names after a rename while reusing the ordered games', () => {
    const games = selectAllGames(state);
    const renamedState = {
      ...state,
      players: {
        ...state.players,
        entities: { ...state.players.entities, p4: player('p4', 'Caroline') },
      },
    };

    expect(selectAllGames(renamedState)).toBe(games);
    expect(selectRecentPlayerNames(renamedState)).toEqual(['Caroline', 'Alice', 'Bob']);
  });
});
