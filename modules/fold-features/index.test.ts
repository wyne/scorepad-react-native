import { act, renderHook } from '@testing-library/react-native';

import { useFold } from './index';

type Listener = (event: { fold: unknown }) => void;

jest.mock('expo', () => {
    const listeners: Listener[] = [];
    const nativeModule = {
        listeners,
        getFold: () => null,
        addListener: jest.fn((_event: string, listener: Listener) => {
            listeners.push(listener);
            return { remove: jest.fn() };
        }),
    };
    return { requireOptionalNativeModule: () => nativeModule };
});

const nativeModule = jest.requireMock('expo').requireOptionalNativeModule() as {
    listeners: Listener[];
    addListener: jest.Mock;
};

describe('useFold', () => {
    it('shares one native listener across callers and updates them together', () => {
        const first = renderHook(() => useFold());
        const second = renderHook(() => useFold());
        expect(nativeModule.addListener).toHaveBeenCalledTimes(1);

        const fold = { orientation: 'vertical', state: 'halfOpened', bounds: { x: 300, y: 0, width: 0, height: 700 } };
        act(() => nativeModule.listeners.forEach(listener => listener({ fold })));

        expect(first.result.current).toBe(fold);
        expect(second.result.current).toBe(fold);
    });
});
