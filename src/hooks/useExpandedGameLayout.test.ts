import { renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { useExpandedGameLayout, useGameFoldSplit, useVerticalBarLayout } from './useExpandedGameLayout';

jest.mock('expo-hinge', () => ({ useHinge: jest.fn(() => null) }));

jest.mock('../../redux/hooks', () => ({
    useAppSelector: jest.fn((selector: (state: unknown) => unknown) =>
        selector({ settings: { home_fullscreen: mockFullscreen } })),
}));

let mockFullscreen = false;

const useHinge: jest.Mock = jest.requireMock('expo-hinge').useHinge;

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

describe('useVerticalBarLayout', () => {
    const verticalBars = () => renderHook(() => useVerticalBarLayout()).result.current;

    beforeEach(() => setPlatform('ios'));
    afterAll(() => setPlatform('ios'));

    it('is true for the iPhone Duo inner display', () => {
        setWindow(951, 669);
        expect(verticalBars()).toBe(true);
    });

    it('is true for the iPhone Duo outer display', () => {
        setWindow(466, 678);
        expect(verticalBars()).toBe(true);
    });

    it('is false for a regular iPhone in either orientation', () => {
        setWindow(393, 852);
        expect(verticalBars()).toBe(false);
        setWindow(852, 393);
        expect(verticalBars()).toBe(false);
    });

    it('is false on iPad', () => {
        setPlatform('ios', true);
        setWindow(1024, 1366);
        expect(verticalBars()).toBe(false);
    });

    it('is false on Android', () => {
        setPlatform('android');
        setWindow(466, 678);
        expect(verticalBars()).toBe(false);
    });
});

describe('useGameFoldSplit', () => {
    const split = () => renderHook(() => useGameFoldSplit()).result.current;
    const setHinge = (status: string | null) => {
        useHinge.mockReturnValue(status == null ? null : { status, angle: 120 });
    };

    beforeEach(() => {
        setPlatform('ios');
        mockFullscreen = false;
    });
    afterAll(() => {
        setPlatform('ios');
        useHinge.mockReturnValue(null);
    });

    it('splits into columns when partially open in landscape', () => {
        setHinge('partiallyOpen');
        setWindow(951, 669);
        expect(split()).toBe('columns');
    });

    it('splits into rows when partially open in portrait', () => {
        setHinge('partiallyOpen');
        setWindow(669, 951);
        expect(split()).toBe('rows');
    });

    it('does not split when flat or closed', () => {
        setWindow(951, 669);
        setHinge('fullyOpen');
        expect(split()).toBeNull();
        setHinge('closed');
        expect(split()).toBeNull();
    });

    it('does not split without a hinge', () => {
        setHinge(null);
        setWindow(951, 669);
        expect(split()).toBeNull();
    });

    it('does not split in fullscreen, which hides the sheet', () => {
        mockFullscreen = true;
        setHinge('partiallyOpen');
        setWindow(951, 669);
        expect(split()).toBeNull();
    });

    it('does not split on Android', () => {
        setPlatform('android');
        setHinge('partiallyOpen');
        setWindow(951, 669);
        expect(split()).toBeNull();
    });
});
