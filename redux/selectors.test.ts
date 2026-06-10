import { InteractionType } from '../src/components/Interactions/InteractionType';

import { selectCurrentGame, selectGamePlayersByScore, selectInteractionType, selectLastStoreReviewPrompt } from './selectors';
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

  describe('selectGamePlayersByScore', () => {
    it('should return game players sorted by total score descending', () => {
      const state = {
        ...mockState,
        games: {
          entities: {
            'game-1': {
              ...mockState.games!.entities['game-1'],
              playerIds: ['player-1', 'player-2', 'player-3'],
            },
          },
          ids: ['game-1'],
        },
        players: {
          entities: {
            'player-1': { id: 'player-1', playerName: 'Alex', scores: [2, 3] },
            'player-2': { id: 'player-2', playerName: 'Blair', scores: [7, 1] },
            'player-3': { id: 'player-3', playerName: 'Casey', scores: [4] },
          },
          ids: ['player-1', 'player-2', 'player-3'],
        },
      } as RootState;

      expect(selectGamePlayersByScore(state, 'game-1')).toEqual([
        { id: 'player-2', name: 'Blair', totalScore: 8 },
        { id: 'player-1', name: 'Alex', totalScore: 5 },
        { id: 'player-3', name: 'Casey', totalScore: 4 },
      ]);
    });

    it('should preserve missing player ids with empty summary values', () => {
      const state = mockState as RootState;

      expect(selectGamePlayersByScore(state, 'game-1')).toEqual([
        { id: 'player-1', name: '', totalScore: 0 },
      ]);
    });
  });
});
