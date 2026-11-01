import { act, renderHook } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

import { useDisplayCornerRadius } from './index';

jest.mock('expo', () => {
    const nativeModule = { getDisplayCornerRadiusAsync: jest.fn(() => Promise.resolve(55)) };
    return { requireOptionalNativeModule: () => nativeModule };
});

const getDisplayCornerRadiusAsync: jest.Mock =
    jest.requireMock('expo').requireOptionalNativeModule().getDisplayCornerRadiusAsync;

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const useWindowDimensions: jest.Mock =
    jest.requireMock('react-native/Libraries/Utilities/useWindowDimensions').default;

const setSizes = (window: [number, number], screen: [number, number]) => {
    useWindowDimensions.mockReturnValue({ width: window[0], height: window[1], scale: 3, fontScale: 1 });
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: screen[0], height: screen[1], scale: 3, fontScale: 1 });
};

describe('useDisplayCornerRadius', () => {
    // Each test uses its own display size, since radii are cached per display.
    it('does not measure a window that does not fill the display, and measures it once it does', async () => {
        setSizes([694, 1024], [1024, 1366]);
        const { result, rerender } = renderHook(() => useDisplayCornerRadius());
        await act(async () => {});
        expect(result.current).toBe(0);
        expect(getDisplayCornerRadiusAsync).not.toHaveBeenCalled();

        setSizes([1024, 1366], [1024, 1366]);
        rerender({});
        await act(async () => {});
        expect(result.current).toBe(55);
        expect(getDisplayCornerRadiusAsync).toHaveBeenCalledTimes(1);
    });

    it('reports the display\'s radius when the window fills the display', async () => {
        setSizes([951, 669], [951, 669]);
        const { result } = renderHook(() => useDisplayCornerRadius());
        await act(async () => {});
        expect(result.current).toBe(55);
    });

    it('reports none for a window that does not fill the display', async () => {
        setSizes([500, 800], [800, 1100]);
        const { result } = renderHook(() => useDisplayCornerRadius());
        await act(async () => {});
        expect(result.current).toBe(0);
    });
});
