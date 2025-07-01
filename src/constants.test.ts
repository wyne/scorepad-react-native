import { systemBlue, STORAGE_KEY, MAX_PLAYERS } from './constants';

describe('constants', () => {
  describe('systemBlue', () => {
    it('should be a valid hex color', () => {
      expect(systemBlue).toBe('#0a84ff');
      expect(systemBlue).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  describe('STORAGE_KEY', () => {
    it('should contain expected storage keys', () => {
      expect(STORAGE_KEY).toHaveProperty('GAMES_LIST');
      expect(STORAGE_KEY.GAMES_LIST).toBe('@games_list');
    });

    it('should have storage keys with @ prefix', () => {
      Object.values(STORAGE_KEY).forEach(key => {
        expect(key).toMatch(/^@/);
      });
    });
  });

  describe('MAX_PLAYERS', () => {
    it('should be 20', () => {
      expect(MAX_PLAYERS).toBe(20);
    });
  });
});

