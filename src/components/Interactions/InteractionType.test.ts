import { InteractionType } from './InteractionType';

describe('InteractionType', () => {
  describe('enum values', () => {
    it('should have HalfTap value', () => {
      expect(InteractionType.HalfTap).toBe('half-tap');
    });

    it('should have SwipeVertical value', () => {
      expect(InteractionType.SwipeVertical).toBe('swipe-vertical');
    });
  });

  describe('enum completeness', () => {
    it('should have exactly 2 interaction types', () => {
      const values = Object.values(InteractionType);
      expect(values).toHaveLength(2);
    });

    it('should contain all expected values', () => {
      const values = Object.values(InteractionType);
      expect(values).toContain('half-tap');
      expect(values).toContain('swipe-vertical');
    });

    it('should have unique values', () => {
      const values = Object.values(InteractionType);
      const uniqueValues = [...new Set(values)];
      expect(values.length).toBe(uniqueValues.length);
    });
  });

  describe('enum keys', () => {
    it('should have correct key names', () => {
      expect(InteractionType).toHaveProperty('HalfTap');
      expect(InteractionType).toHaveProperty('SwipeVertical');
    });

    it('should have exactly 2 keys', () => {
      const keys = Object.keys(InteractionType);
      expect(keys).toHaveLength(2);
    });
  });

  describe('type validation', () => {
    it('should be string enum', () => {
      expect(typeof InteractionType.HalfTap).toBe('string');
      expect(typeof InteractionType.SwipeVertical).toBe('string');
    });

    it('should have string values that match expected format', () => {
      expect(InteractionType.HalfTap).toMatch(/^[a-z-]+$/);
      expect(InteractionType.SwipeVertical).toMatch(/^[a-z-]+$/);
    });
  });
});

