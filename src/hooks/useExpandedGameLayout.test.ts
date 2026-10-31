import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { useExpandedGameLayout, useGameFoldSplit, useVerticalBarLayout } from './useExpandedGameLayout';

type MockHinge = {
    angle: number;
    status: 'closed' | 'partiallyOpen' | 'fullyOpen' | 'unknown';
} | null;
type MockHingeStatus = NonNullable<MockHinge>['status'];

let mockCurrentHinge: MockHinge = null;
let mockHingeListener: ((event: { hinge: MockHinge }) => void) | null = null;

jest.mock('expo-hinge', () => ({
    getHinge: jest.fn(() => mockCurrentHinge),
    addHingeListener: jest.fn((listener: (event: { hinge: MockHinge }) => void) => {
        mockHingeListener = listener;
        return { remove: jest.fn() };
    }),
}));

jest.mock('../../redux/hooks', () => ({
    useAppSelector: jest.fn((selector: (state: unknown) => unknown) =>
        selector({ settings: { home_fullscreen: mockFullscreen } })),
}));

let mockFullscreen = false;

const addHingeListener: jest.Mock = jest.requireMock('expo-hinge').addHingeListener;

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
    const renderSplit = () => renderHook(() => useGameFoldSplit());
    const setHinge = (status: MockHingeStatus | null) => {
        mockCurrentHinge = status == null ? null : { status, angle: 120 };
    };
    const emitHinge = (hinge: MockHinge) => {
        mockCurrentHinge = hinge;
        mockHingeListener?.({ hinge });
    };
    const settleHinge = () => act(() => jest.advanceTimersByTime(250));

    beforeEach(() => {
        jest.useFakeTimers();
        setPlatform('ios');
        mockFullscreen = false;
        mockCurrentHinge = null;
        mockHingeListener = null;
        addHingeListener.mockClear();
    });
    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });
    afterAll(() => {
        setPlatform('ios');
        mockCurrentHinge = null;
    });

    it('splits into columns when partially open in landscape', () => {
        setHinge('partiallyOpen');
        setWindow(951, 669);
        const split = renderSplit();

        expect(split.result.current).toBeNull();
        settleHinge();
        expect(split.result.current).toBe('columns');
    });

    it('splits into rows when partially open in portrait', () => {
        setHinge('partiallyOpen');
        setWindow(669, 951);
        const split = renderSplit();

        settleHinge();
        expect(split.result.current).toBe('rows');
    });

    it('does not split when flat or closed', () => {
        setWindow(951, 669);
        setHinge('fullyOpen');
        const flat = renderSplit();
        expect(flat.result.current).toBeNull();
        flat.unmount();
        setHinge('closed');
        expect(renderSplit().result.current).toBeNull();
    });

    it('does not split without a hinge', () => {
        setHinge(null);
        setWindow(951, 669);
        expect(renderSplit().result.current).toBeNull();
    });

    it('does not split in fullscreen, which hides the sheet', () => {
        mockFullscreen = true;
        setHinge('partiallyOpen');
        setWindow(951, 669);
        const split = renderSplit();

        settleHinge();
        expect(split.result.current).toBeNull();
    });

    it('does not split on Android', () => {
        setPlatform('android');
        setHinge('partiallyOpen');
        setWindow(951, 669);
        expect(renderSplit().result.current).toBeNull();
        expect(addHingeListener).not.toHaveBeenCalled();
    });

    it('does not expose transient book mode while the hinge continues to fully open', () => {
        setHinge('closed');
        setWindow(951, 669);
        let renderCount = 0;
        const split = renderHook(() => {
            renderCount += 1;
            return useGameFoldSplit();
        });

        act(() => emitHinge({ status: 'partiallyOpen', angle: 90 }));
        act(() => jest.advanceTimersByTime(150));
        act(() => emitHinge({ status: 'partiallyOpen', angle: 140 }));
        act(() => jest.advanceTimersByTime(150));

        expect(split.result.current).toBeNull();
        act(() => emitHinge({ status: 'fullyOpen', angle: 180 }));
        act(() => jest.advanceTimersByTime(250));

        expect(split.result.current).toBeNull();
        expect(renderCount).toBe(1);
    });

    it('enters book mode only after hinge motion has settled', () => {
        setHinge('closed');
        setWindow(951, 669);
        const split = renderSplit();

        act(() => emitHinge({ status: 'partiallyOpen', angle: 90 }));
        act(() => jest.advanceTimersByTime(200));
        act(() => emitHinge({ status: 'partiallyOpen', angle: 120 }));
        act(() => jest.advanceTimersByTime(249));
        expect(split.result.current).toBeNull();

        act(() => jest.advanceTimersByTime(1));
        expect(split.result.current).toBe('columns');
    });

    it('shares one native subscription and ignores angle-only changes', () => {
        setHinge('partiallyOpen');
        setWindow(951, 669);
        let renderCount = 0;

        const first = renderHook(() => {
            renderCount += 1;
            return useGameFoldSplit();
        });
        const second = renderSplit();

        expect(first.result.current).toBeNull();
        expect(second.result.current).toBeNull();
        expect(addHingeListener).toHaveBeenCalledTimes(1);

        settleHinge();
        expect(first.result.current).toBe('columns');
        expect(second.result.current).toBe('columns');
        expect(renderCount).toBe(2);

        act(() => emitHinge({ status: 'partiallyOpen', angle: 121 }));
        expect(renderCount).toBe(2);

        act(() => emitHinge({ status: 'fullyOpen', angle: 180 }));
        expect(first.result.current).toBeNull();
        expect(second.result.current).toBeNull();
        expect(renderCount).toBe(3);
    });
});
