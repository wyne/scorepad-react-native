import { useDispatch, useSelector } from 'react-redux';

import { useAppDispatch, useAppSelector } from './hooks';

// Mock react-redux hooks
const mockDispatchFn = jest.fn();
const mockSelectorFn = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(() => mockDispatchFn),
  useSelector: jest.fn(() => mockSelectorFn),
}));

describe('Redux hooks', () => {
  describe('useAppDispatch', () => {
    it('should be the same as useDispatch', () => {
      expect(useAppDispatch).toBe(useDispatch);
    });

    it('should return a dispatch function', () => {
      const dispatch = useAppDispatch();
      expect(typeof dispatch).toBe('function');
    });
  });

  describe('useAppSelector', () => {
    it('should be the same as useSelector', () => {
      expect(useAppSelector).toBe(useSelector);
    });

    it('should have the correct type signature', () => {
      // This test ensures TypeScript types are preserved
      expect(typeof useAppSelector).toBe('function');
    });
  });
});
