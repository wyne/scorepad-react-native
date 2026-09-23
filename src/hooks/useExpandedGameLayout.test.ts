import { renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { useExpandedGameLayout } from './useExpandedGameLayout';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const useWindowDimensions: jest.Mock =
    jest.requireMock('react-native/Libraries/Utilities/useWindowDimensions').default;

const setWindow = (width: number, height: number) => {
    useWindowDimensions.mockReturnValue({ width, height, scale: 3, fontScale: 1 });
};

const setPlatform = (os: 'ios' | 'android', isPad = false) => {
    Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
    Object.defineProperty(Platform, 'isPad', { value: isPad, configurable: true });
};

const expanded = () => renderHook(() => useExpandedGameLayout()).result.current;

describe('useExpandedGameLayout', () => {
    beforeEach(() => setPlatform('ios'));
    afterAll(() => setPlatform('ios'));

    it('is true for the iPhone Duo inner display in landscape', () => {
        setWindow(951, 669);
        expect(expanded()).toBe(true);
    });

    it('is false for a regular iPhone in landscape', () => {
        setWindow(932, 430);
        expect(expanded()).toBe(false);
    });

    it('is false in portrait', () => {
        setWindow(669, 951);
        expect(expanded()).toBe(false);
    });

    it('is false on iPad', () => {
        setPlatform('ios', true);
        setWindow(1366, 1024);
        expect(expanded()).toBe(false);
    });

    it('is false on Android', () => {
        setPlatform('android');
        setWindow(951, 669);
        expect(expanded()).toBe(false);
    });
});
