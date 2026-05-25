import { InteractionType } from '../src/components/Interactions/InteractionType';

import { selectInteractionType, selectCurrentGame, selectLastStoreReviewPrompt } from './selectors';
import { RootState } from './store';

// Mock data for testing
const mockState: Partial<RootState> = {
  settings: {
    home_fullscreen: false,
    multiplier: 1,
    addendOne: 1,
    addendTwo: 10,
    currentGameId: 'game-1',
    onboarded: undefined,
    showPointParticles: true,
    showPlayerIndex: true,
    interactionType: InteractionType.SwipeVertical,
    lastStoreReviewPrompt: 1234567890,
    appOpens: 1,
    installId: 'test-install-id',
    keepScreenAwakeDuration: 0,
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
});
