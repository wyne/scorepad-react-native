import { GameState } from '../../../redux/GamesSlice';
import { ScoreState } from '../../../redux/PlayersSlice';
import { RootState } from '../../../redux/store';
import { InteractionType } from '../Interactions/InteractionType';

import { selectSortedPlayerIdsByIndex, selectSortedPlayerIdsByScore, SortDirectionKey } from './SortHelper';

// Mock data for testing
const mockGameState: GameState = {
  id: 'game-1',
  title: 'Test Game',
  dateCreated: Date.now(),
  roundCurrent: 2,
  roundTotal: 3,
  playerIds: ['player-1', 'player-2', 'player-3'],
  sortDirectionKey: SortDirectionKey.Normal,
};

const mockPlayers: ScoreState[] = [
  {
    id: 'player-1',
    playerName: 'Player 1',
    scores: [10, 20, 15], // Total: 45
    color: '#ff0000',
  },
  {
    id: 'player-2',
    playerName: 'Player 2', 
    scores: [15, 25, 10], // Total: 50
    color: '#00ff00',
  },
  {
    id: 'player-3',
    playerName: 'Player 3',
    scores: [20, 15, 15], // Total: 50 (tie with player-2)
    color: '#0000ff',
  },
];

const createMockState = (
  game: Partial<GameState> = {},
  players: ScoreState[] = mockPlayers,
  currentGameId = 'game-1'
): RootState => ({
  settings: {
    multiplier: 1,
    addendOne: 1,
    addendTwo: 10,
    currentGameId,
    showPointParticles: true,
    showPlayerIndex: true,
    interactionType: InteractionType.SwipeVertical,
    home_fullscreen: false,
    lastStoreReviewPrompt: Date.now(),
    appOpens: 1,
    installId: 'test-install-id',
    keepScreenAwake: false,
    seenFeatureNotifications: [],
    colorScheme: 'system',
  },
  games: {
    entities: {
      'game-1': { ...mockGameState, ...game },
    },
    ids: ['game-1'],
  },
  players: {
    entities: Object.fromEntries(players.map(p => [p.id, p])),
    ids: players.map(p => p.id),
  },
});

describe('SortHelper', () => {
  describe('selectSortedPlayerIdsByIndex', () => {
    it('should return players sorted by index in normal order', () => {
      const state = createMockState();
      const result = selectSortedPlayerIdsByIndex(state);
      
      expect(result).toEqual(['player-1', 'player-2', 'player-3']);
    });

    it('should return players sorted by index in reversed order', () => {
      const state = createMockState({ sortDirectionKey: SortDirectionKey.Reversed });
      const result = selectSortedPlayerIdsByIndex(state);
      
      expect(result).toEqual(['player-3', 'player-2', 'player-1']);
    });

    it('should return empty array when no current game', () => {
      const state = createMockState({}, [], 'non-existent-game');
      const result = selectSortedPlayerIdsByIndex(state);
      
      expect(result).toEqual([]);
    });

    it('should handle empty player list', () => {
      const state = createMockState({ playerIds: [] });
      const result = selectSortedPlayerIdsByIndex(state);
      
      expect(result).toEqual([]);
    });

  });

  describe('selectSortedPlayerIdsByScore', () => {
    it('should return players sorted by score in descending order (normal)', () => {
      const state = createMockState();
      const result = selectSortedPlayerIdsByScore(state);
      
      // player-2 (50) and player-3 (50) should be first, then player-1 (45)
      // With ties, player-2 comes before player-3 due to index order
      expect(result).toEqual(['player-2', 'player-3', 'player-1']);
    });

    it('should return players sorted by score in ascending order (reversed)', () => {
      const state = createMockState({ sortDirectionKey: SortDirectionKey.Reversed });
      const result = selectSortedPlayerIdsByScore(state);
      
      expect(result).toEqual(['player-1', 'player-3', 'player-2']);
    });

    it('should handle tie-breaking by player index', () => {
      const playersWithTie: ScoreState[] = [
        {
          id: 'player-1',
          playerName: 'Player 1',
          scores: [25, 25], // Total: 50
          color: '#ff0000',
        },
        {
          id: 'player-2', 
          playerName: 'Player 2',
          scores: [25, 25], // Total: 50 (same as player-1)
          color: '#00ff00',
        },
      ];
      
      const state = createMockState({}, playersWithTie);
      const result = selectSortedPlayerIdsByScore(state);
      
      // Both have same score, so order should be by index: player-1, player-2
      expect(result).toEqual(['player-1', 'player-2']);
    });

    it('should return empty array when no current game', () => {
      const state = createMockState({}, [], 'non-existent-game');
      const result = selectSortedPlayerIdsByScore(state);
      
      expect(result).toEqual([]);
    });

    it('should filter out players not in current game', () => {
      const extraPlayers: ScoreState[] = [
        ...mockPlayers,
        {
          id: 'player-4',
          playerName: 'Player 4',
          scores: [100],
          color: '#ffff00',
        },
      ];
      
      const state = createMockState({}, extraPlayers);
      const result = selectSortedPlayerIdsByScore(state);
      
      // Should only include players in the game's playerIds
      expect(result).toEqual(['player-2', 'player-3', 'player-1']);
      expect(result).not.toContain('player-4');
    });

    it('should handle empty scores array', () => {
      const playersWithEmptyScores: ScoreState[] = [
        {
          id: 'player-1',
          playerName: 'Player 1',
          scores: [], // Total: 0
          color: '#ff0000',
        },
        {
          id: 'player-2',
          playerName: 'Player 2',
          scores: [10], // Total: 10
          color: '#00ff00',
        },
      ];
      
      const state = createMockState({ playerIds: ['player-1', 'player-2'] }, playersWithEmptyScores);
      const result = selectSortedPlayerIdsByScore(state);
      
      expect(result).toEqual(['player-2', 'player-1']);
    });
  });

});

