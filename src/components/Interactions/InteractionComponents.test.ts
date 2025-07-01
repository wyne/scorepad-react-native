import { interactionComponents } from './InteractionComponents';
import { InteractionType } from './InteractionType';

// Mock the component imports
jest.mock('./HalfTap/HalfTap', () => 'MockedHalfTap');
jest.mock('./Swipe/Swipe', () => 'MockedSwipe');

describe('InteractionComponents', () => {
  describe('component mapping', () => {
    it('should map HalfTap interaction type to HalfTap component', () => {
      expect(interactionComponents[InteractionType.HalfTap]).toBe('MockedHalfTap');
    });

    it('should map SwipeVertical interaction type to Swipe component', () => {
      expect(interactionComponents[InteractionType.SwipeVertical]).toBe('MockedSwipe');
    });
  });

  describe('completeness', () => {
    it('should have mapping for all interaction types', () => {
      const interactionTypes = Object.values(InteractionType);
      const mappedTypes = Object.keys(interactionComponents);
      
      interactionTypes.forEach(type => {
        expect(mappedTypes).toContain(type);
      });
    });

    it('should have exactly the same number of mappings as interaction types', () => {
      const interactionTypesCount = Object.values(InteractionType).length;
      const mappingsCount = Object.keys(interactionComponents).length;
      
      expect(mappingsCount).toBe(interactionTypesCount);
    });

    it('should not have undefined mappings', () => {
      Object.values(interactionComponents).forEach(component => {
        expect(component).toBeDefined();
        expect(component).not.toBeNull();
      });
    });
  });

  describe('object structure', () => {
    it('should be an object', () => {
      expect(typeof interactionComponents).toBe('object');
      expect(interactionComponents).not.toBeNull();
      expect(Array.isArray(interactionComponents)).toBe(false);
    });

    it('should have correct property types', () => {
      Object.entries(interactionComponents).forEach(([key, value]) => {
        expect(typeof key).toBe('string');
        expect(value).toBeDefined();
      });
    });
  });

  describe('dynamic access', () => {
    it('should allow dynamic component access by interaction type', () => {
      const halfTapComponent = interactionComponents[InteractionType.HalfTap];
      const swipeComponent = interactionComponents[InteractionType.SwipeVertical];
      
      expect(halfTapComponent).toBe('MockedHalfTap');
      expect(swipeComponent).toBe('MockedSwipe');
    });

    it('should return undefined for non-existent interaction type', () => {
      const nonExistentComponent = interactionComponents['non-existent' as InteractionType];
      expect(nonExistentComponent).toBeUndefined();
    });
  });
});

