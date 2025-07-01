import { 
  animationDuration,
  singleLineScoreSizeMultiplier,
  multiLineScoreSizeMultiplier,
  baseScoreFontSize,
  scoreMathOpacity,
  calculateFontSize,
  widthFactor,
  ZoomOutFadeOut
} from './Helpers';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => ({
  Easing: {
    ease: 'ease'
  },
  LinearTransition: {
    easing: jest.fn().mockReturnThis(),
    duration: jest.fn().mockReturnThis()
  },
  ZoomIn: {
    duration: jest.fn().mockReturnThis()
  },
  ZoomOut: {
    duration: jest.fn().mockReturnThis()
  },
  withTiming: jest.fn((value, config) => ({ value, config }))
}));

describe('AdditionTile Helpers', () => {
  describe('constants', () => {
    it('should have correct animation duration', () => {
      expect(animationDuration).toBe(200);
      expect(typeof animationDuration).toBe('number');
    });

    it('should have correct font size multipliers', () => {
      expect(singleLineScoreSizeMultiplier).toBe(1.2);
      expect(multiLineScoreSizeMultiplier).toBe(0.7);
      expect(singleLineScoreSizeMultiplier).toBeGreaterThan(multiLineScoreSizeMultiplier);
    });

    it('should have correct base font size', () => {
      expect(baseScoreFontSize).toBe(40);
      expect(typeof baseScoreFontSize).toBe('number');
    });

    it('should have correct score math opacity', () => {
      expect(scoreMathOpacity).toBe(0.75);
      expect(scoreMathOpacity).toBeGreaterThan(0);
      expect(scoreMathOpacity).toBeLessThan(1);
    });
  });

  describe('widthFactor', () => {
    it('should calculate width factor based on container width', () => {
      expect(widthFactor(200)).toBe(1);
      expect(widthFactor(100)).toBe(0.5);
      expect(widthFactor(400)).toBe(2);
    });

    it('should handle zero width', () => {
      expect(widthFactor(0)).toBe(0);
    });

    it('should handle NaN input', () => {
      expect(widthFactor(NaN)).toBe(1);
    });

    it('should handle negative width', () => {
      expect(widthFactor(-100)).toBe(-0.5);
    });
  });

  describe('calculateFontSize', () => {
    it('should calculate font size based on container width', () => {
      expect(calculateFontSize(200)).toBe(40); // baseScoreFontSize * 1
      expect(calculateFontSize(100)).toBe(20); // baseScoreFontSize * 0.5
      expect(calculateFontSize(400)).toBe(80); // baseScoreFontSize * 2
    });

    it('should handle zero width', () => {
      expect(calculateFontSize(0)).toBe(0);
    });

    it('should handle NaN input', () => {
      expect(calculateFontSize(NaN)).toBe(40); // baseScoreFontSize * 1 (fallback)
    });
  });

  describe('ZoomOutFadeOut', () => {
    it('should return animation configuration', () => {
      const result = ZoomOutFadeOut();
      
      expect(result).toHaveProperty('initialValues');
      expect(result).toHaveProperty('animations');
      
      expect(result.initialValues).toEqual({
        transform: [{ scale: 1 }],
        opacity: 1,
      });
      
      expect(result.animations.transform).toEqual([{ 
        scale: { value: 0, config: { duration: animationDuration } }
      }]);
      expect(result.animations.opacity).toEqual({ 
        value: 0, 
        config: { duration: animationDuration } 
      });
    });
  });
});

