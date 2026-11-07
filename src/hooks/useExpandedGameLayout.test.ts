import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { useAvailableGameDock, useFoldSplitBounds, useGameDock, useGameDockBounds, useGameDockLayout, useGameFoldSplit, useVerticalBarLayout } from './useExpandedGameLayout';

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

type MockFold = {
    orientation: 'vertical' | 'horizontal';
    state: 'halfOpened' | 'flat';
    bounds: { x: number; y: number; width: number; height: number };
} | null;
let mockFold: MockFold = null;
let mockFoldListener: ((event: { fold: MockFold }) => void) | null = null;
let mockInsets = { top: 0, right: 0, bottom: 0, left: 0 };
jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => mockInsets,
}));

jest.mock('../../modules/fold-features', () => ({
    useFold: () => mockFold,
    getFold: () => mockFold,
    addFoldListener: (listener: (event: { fold: MockFold }) => void) => {
        mockFoldListener = listener;
        return { remove: () => { mockFoldListener = null; } };
    },
}));

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

describe('useGameDock', () => {
    const dock = () => renderHook(() => useGameDock()).result.current;
    const available = () => renderHook(() => useAvailableGameDock()).result.current;

    beforeEach(() => {
        setPlatform('ios');
        mockFullscreen = false;
        mockCurrentHinge = null;
        mockFold = null;
    });
    afterAll(() => {
        setPlatform('ios');
        mockFullscreen = false;
    });

    it('docks beside the board on an iPad in landscape', () => {
        setPlatform('ios', true);
        setWindow(1366, 1024);
        expect(dock()).toBe('columns');
    });

    it('docks below the board on an iPad in portrait', () => {
        setPlatform('ios', true);
        setWindow(1024, 1366);
        expect(dock()).toBe('rows');
    });

    it('docks on the flat iPhone Duo inner display in either orientation', () => {
        setWindow(951, 669);
        expect(dock()).toBe('columns');
        setWindow(669, 951);
        expect(dock()).toBe('rows');
    });

    it('docks on an unfolded Android foldable', () => {
        setPlatform('android');
        setWindow(841, 701);
        expect(dock()).toBe('columns');
    });

    it('does not dock on phones in either orientation', () => {
        setWindow(932, 430);
        expect(dock()).toBeNull();
        setWindow(430, 932);
        expect(dock()).toBeNull();
    });

    it('does not dock in a narrow iPad Split View window', () => {
        setPlatform('ios', true);
        setWindow(507, 1024);
        expect(dock()).toBeNull();
    });

    it('does not dock in fullscreen, but stays available to show again', () => {
        setPlatform('ios', true);
        setWindow(1366, 1024);
        mockFullscreen = true;
        expect(dock()).toBeNull();
        expect(available()).toBe('columns');
    });

    it('is not available on phones', () => {
        setWindow(932, 430);
        expect(available()).toBeNull();
    });
});

describe('useGameDockBounds', () => {
    const bounds = (dock: 'columns' | 'rows') => renderHook(() => useGameDockBounds(dock)).result.current;

    beforeEach(() => {
        setPlatform('ios');
        mockFullscreen = false;
        mockCurrentHinge = null;
        mockFold = null;
        mockInsets = { top: 0, right: 0, bottom: 0, left: 0 };
    });

    it('gives the sheet a panel at the right edge in a wide window', () => {
        setPlatform('ios', true);
        setWindow(1366, 1024);
        expect(bounds('columns')).toEqual({ boardEnd: 1366 - 420, sheetStart: 1366 - 420 });
        setWindow(1180, 820);
        expect(bounds('columns')).toEqual({ boardEnd: 1180 - 401, sheetStart: 1180 - 401 });
    });

    it('keeps the panel inside the iPhone Duo vertical bar', () => {
        setWindow(951, 669);
        mockInsets = { top: 24, right: 92, bottom: 0, left: 0 };
        expect(bounds('columns')).toEqual({ boardEnd: 951 - 92 - 320, sheetStart: 951 - 92 - 320 });
    });

    it('gives the sheet about a third of the height below the board', () => {
        setPlatform('ios', true);
        setWindow(1024, 1366);
        expect(bounds('rows')).toEqual({ boardEnd: 1366 - 437, sheetStart: 1366 - 437 });
        setWindow(669, 951);
        expect(bounds('rows')).toEqual({ boardEnd: 951 - 304, sheetStart: 951 - 304 });
    });
});

describe('useGameDockLayout', () => {
    const layout = () => renderHook(() => useGameDockLayout()).result.current;

    beforeEach(() => {
        setPlatform('ios');
        mockFullscreen = false;
        mockCurrentHinge = null;
        mockFold = null;
    });

    it('is a panel in a wide window and null on phones', () => {
        setWindow(951, 669);
        expect(layout()).toBe('columns-panel');
        setWindow(932, 430);
        expect(layout()).toBeNull();
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
        mockFold = null;
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

    describe('on Android', () => {
        const halfOpenFold = (orientation: 'vertical' | 'horizontal'): MockFold => ({
            orientation,
            state: 'halfOpened',
            bounds: orientation === 'vertical'
                ? { x: 346, y: 0, width: 0, height: 717 }
                : { x: 0, y: 346, width: 717, height: 0 },
        });

        beforeEach(() => setPlatform('android'));

        // The Pixel Fold's inner screen is nearly square and, held like a
        // book, slightly taller than wide: the fold's direction comes from the
        // window manager, not the window's shape.
        it('splits into columns along a vertical fold, even in a portrait window', () => {
            mockFold = halfOpenFold('vertical');
            setWindow(692, 717);
            const split = renderSplit();

            settleHinge();
            expect(split.result.current).toBe('columns');
        });

        it('splits into rows along a horizontal fold, even in a landscape window', () => {
            mockFold = halfOpenFold('horizontal');
            setWindow(717, 692);
            const split = renderSplit();

            settleHinge();
            expect(split.result.current).toBe('rows');
        });

        it('waits for the hinge to stop moving when a hinge angle sensor exists', () => {
            mockFold = halfOpenFold('vertical');
            setWindow(692, 717);
            const split = renderSplit();

            // The window manager reports half open throughout a continuous opening.
            for (let angle = 60; angle <= 160; angle += 20) {
                act(() => emitHinge({ status: 'partiallyOpen', angle }));
                act(() => jest.advanceTimersByTime(100));
            }
            expect(split.result.current).toBeNull();

            act(() => jest.advanceTimersByTime(150));
            expect(split.result.current).toBe('columns');
        });

        it('takes half open from the window manager, not the hinge sensor', () => {
            setHinge('partiallyOpen');
            setWindow(717, 692);
            const split = renderSplit();

            settleHinge();
            // The hinge sensor alone never turns book mode on.
            expect(split.result.current).toBeNull();

            act(() => {
                mockFold = halfOpenFold('vertical');
                mockFoldListener?.({ fold: mockFold });
            });
            settleHinge();
            expect(split.result.current).toBe('columns');

            act(() => {
                mockFold = { ...halfOpenFold('vertical')!, state: 'flat' };
                mockFoldListener?.({ fold: mockFold });
            });
            expect(split.result.current).toBeNull();
        });
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

    // Recorded on the iPhone Duo simulator opening from the cover display: the
    // last few degrees arrive slowly, still partially open, before fully open.
    it('does not enter book mode while the hinge creeps the last degrees to flat', () => {
        setHinge('closed');
        setWindow(951, 669);
        const split = renderSplit();

        // (The JS thread was busy with the move to the inner display here, so
        // the gap after this sample held up the settle timer as well.)
        act(() => emitHinge({ status: 'partiallyOpen', angle: 23.3 }));
        act(() => jest.advanceTimersByTime(200));
        for (const angle of [155.9, 164.6, 168, 169.8, 171.2, 172.2, 173.5, 173.9]) {
            act(() => emitHinge({ status: 'partiallyOpen', angle }));
            act(() => jest.advanceTimersByTime(20));
        }
        act(() => jest.advanceTimersByTime(556));
        expect(split.result.current).toBeNull();

        act(() => emitHinge({ status: 'fullyOpen', angle: 180 }));
        expect(split.result.current).toBeNull();
    });

    it('enters book mode when the hinge comes back from nearly flat', () => {
        setHinge('closed');
        setWindow(951, 669);
        const split = renderSplit();

        act(() => emitHinge({ status: 'partiallyOpen', angle: 170 }));
        act(() => jest.advanceTimersByTime(300));
        expect(split.result.current).toBeNull();

        act(() => emitHinge({ status: 'partiallyOpen', angle: 120 }));
        settleHinge();
        expect(split.result.current).toBe('columns');
    });

    it('settles despite sensor jitter while the device rests half open', () => {
        setHinge('closed');
        setWindow(951, 669);
        const split = renderSplit();

        act(() => emitHinge({ status: 'partiallyOpen', angle: 120 }));
        act(() => jest.advanceTimersByTime(100));
        act(() => emitHinge({ status: 'partiallyOpen', angle: 121.5 }));
        act(() => jest.advanceTimersByTime(100));
        act(() => emitHinge({ status: 'partiallyOpen', angle: 119 }));
        act(() => jest.advanceTimersByTime(50));

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

describe('useFoldSplitBounds', () => {
    const bounds = (split: 'columns' | 'rows') => renderHook(() => useFoldSplitBounds(split)).result.current;

    afterEach(() => {
        setPlatform('ios');
        mockFold = null;
    });

    it('assumes the iPhone Duo folds through the middle of the window', () => {
        setPlatform('ios');
        setWindow(951, 669);
        expect(bounds('columns')).toEqual({ boardEnd: 951 / 2 - 16, sheetStart: 951 / 2 + 16 });
    });

    it('splits at the fold Android reports, keeping at least the usual gap', () => {
        setPlatform('android');
        setWindow(717, 692);
        mockFold = { orientation: 'vertical', state: 'halfOpened', bounds: { x: 300, y: 0, width: 0, height: 692 } };
        expect(bounds('columns')).toEqual({ boardEnd: 284, sheetStart: 316 });

        mockFold = { orientation: 'vertical', state: 'halfOpened', bounds: { x: 300, y: 0, width: 40, height: 692 } };
        expect(bounds('columns')).toEqual({ boardEnd: 300, sheetStart: 340 });
    });
});
