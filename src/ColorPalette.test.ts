import { getPalettes, getPalette, setPlayerColor } from './ColorPalette';

// Mock the Redux hooks
jest.mock('../redux/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: unknown) => unknown) => selector(mockState),
}));

const mockDispatch = jest.fn();
const mockState = {
  players: {
    entities: {
      'player-1': {
        id: 'player-1',
        playerName: 'Test Player',
        scores: [10, 20],
        color: '#ff0000',
      },
    },
    ids: ['player-1'],
  },
  games: { entities: {}, ids: [] },
  settings: {
    home_fullscreen: false,
    multiplier: 1,
    addendOne: 1,
    addendTwo: 10,
    currentGameId: undefined,
    onboarded: undefined,
    showPointParticles: true,
    showPlayerIndex: true,
    interactionType: 0,
    lastStoreReviewPrompt: Date.now(),
    appOpens: 1,
    installId: 'test-install-id',
  },
};

describe('ColorPalette', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPalettes', () => {
    it('should return array of palette names', () => {
      const result = getPalettes();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('original');
      expect(result).toContain('tropical-fiesta');
      expect(result).toContain('spring');
      expect(result).toContain('autumn');
      expect(result).toContain('harkonnen');
      expect(result).toContain('electric-orchid');
      expect(result).toContain('autumn-ocean');
      expect(result).toContain('sunset-harbor');
    });

    it('should return all expected palette names', () => {
      const result = getPalettes();
      const expectedPalettes = [
        'original',
        'tropical-fiesta', 
        'spring',
        'autumn',
        'harkonnen',
        'electric-orchid',
        'autumn-ocean',
        'sunset-harbor'
      ];
      
      expect(result).toEqual(expect.arrayContaining(expectedPalettes));
      expect(result.length).toBe(expectedPalettes.length);
    });

    it('should return unique palette names', () => {
      const result = getPalettes();
      const uniqueResult = [...new Set(result)];
      
      expect(result.length).toBe(uniqueResult.length);
    });
  });

  describe('getPalette', () => {
    it('should return original palette colors', () => {
      const result = getPalette('original');
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([
        '#01497c',
        '#c25858',
        '#f5c800',
        '#275436',
        '#dc902c',
        '#62516a',
        '#755647',
        '#e9ecef',
        '#212529',
      ]);
    });

    it('should return tropical-fiesta palette colors', () => {
      const result = getPalette('tropical-fiesta');
      
      expect(result).toEqual([
        '#f8ffe5',
        '#06d6a0',
        '#1b9aaa',
        '#ef476f',
        '#ffc43d'
      ]);
    });

    it('should return spring palette colors', () => {
      const result = getPalette('spring');
      
      expect(result).toEqual([
        '#7bdff2',
        '#b2f7ef',
        '#eff7f6',
        '#f7d6e0',
        '#f2b5d4'
      ]);
    });

    it('should return autumn palette colors', () => {
      const result = getPalette('autumn');
      
      expect(result).toEqual([
        '#fcaa67',
        '#b0413e',
        '#ffffc7',
        '#548687',
        '#473335'
      ]);
    });

    it('should return harkonnen palette colors', () => {
      const result = getPalette('harkonnen');
      
      expect(result).toEqual([
        '#f8f9fa',
        '#e9ecef',
        '#dee2e6',
        '#ced4da',
        '#adb5bd',
        '#6c757d',
        '#495057',
        '#343a40',
        '#212529',
        '#000000',
      ]);
    });

    it('should return electric-orchid palette colors', () => {
      const result = getPalette('electric-orchid');
      
      expect(result).toEqual([
        '#f72585',
        '#b5179e',
        '#7209b7',
        '#560bad',
        '#480ca8',
        '#3a0ca3',
        '#3f37c9',
        '#4361ee',
        '#4895ef',
        '#4cc9f0',
      ]);
    });

    it('should return autumn-ocean palette colors', () => {
      const result = getPalette('autumn-ocean');
      
      expect(result).toEqual([
        '#005f73',
        '#0a9396',
        '#94d2bd',
        '#e9d8a6',
        '#ee9b00',
        '#ca6702',
        '#bb3e03',
        '#ae2012',
      ]);
    });

    it('should return sunset-harbor palette colors', () => {
      const result = getPalette('sunset-harbor');
      
      expect(result).toEqual([
        '#edae49',
        '#d1495b',
        '#00798c',
        '#30638e',
        '#003d5b',
      ]);
    });

    it('should return undefined for non-existent palette', () => {
      const result = getPalette('non-existent-palette');
      
      expect(result).toBeUndefined();
    });

    it('should validate all colors are valid hex format', () => {
      const palettes = getPalettes();
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
      
      palettes.forEach(paletteName => {
        const colors = getPalette(paletteName);
        colors.forEach(color => {
          expect(color).toMatch(hexColorRegex);
        });
      });
    });

    it('should ensure all palettes have at least one color', () => {
      const palettes = getPalettes();
      
      palettes.forEach(paletteName => {
        const colors = getPalette(paletteName);
        expect(colors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('setPlayerColor', () => {
    it('should dispatch updatePlayer action when player exists', () => {
      setPlayerColor('player-1', '#00ff00');
      
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'players/updatePlayer',
        payload: {
          id: 'player-1',
          changes: {
            color: '#00ff00',
          },
        },
      });
    });

    it('should not dispatch when player does not exist', () => {
      // Mock useAppSelector to return undefined player
      const mockStateWithoutPlayer = {
        ...mockState,
        players: {
          entities: {},
          ids: [],
        },
      };
      
      // Override the mock selector for this test
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const originalMock = require('../redux/hooks').useAppSelector;
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../redux/hooks').useAppSelector = jest.fn((selector: (state: unknown) => unknown) => 
        selector(mockStateWithoutPlayer)
      );
      
      setPlayerColor('non-existent-player', '#00ff00');
      
      expect(mockDispatch).not.toHaveBeenCalled();
      
      // Restore the original mock
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../redux/hooks').useAppSelector = originalMock;
    });

    it('should handle different color formats', () => {
      const colors = ['#ff0000', '#00FF00', '#0000ff', '#FFFFFF', '#000000'];
      
      colors.forEach(color => {
        mockDispatch.mockClear();
        setPlayerColor('player-1', color);
        
        expect(mockDispatch).toHaveBeenCalledWith({
          type: 'players/updatePlayer',
          payload: {
            id: 'player-1',
            changes: {
              color: color,
            },
          },
        });
      });
    });

  });
});
