import { act, renderHook } from '@testing-library/react-native';
import { Dimensions } from 'react-native';

import { useDisplayCornerRadius } from './index';

jest.mock('expo', () => ({
    requireOptionalNativeModule: () => ({
        getDisplayCornerRadiusAsync: jest.fn(() => Promise.resolve(55)),
    }),
}));

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
    it('reports the display\'s radius when the window fills the display', async () => {
        setSizes([951, 669], [951, 669]);
        const { result } = renderHook(() => useDisplayCornerRadius());
        await act(async () => {});
        expect(result.current).toBe(55);
    });

    it('reports none for a window that does not fill the display', async () => {
        setSizes([694, 1024], [1366, 1024]);
        const { result } = renderHook(() => useDisplayCornerRadius());
        await act(async () => {});
        expect(result.current).toBe(0);
    });
});
