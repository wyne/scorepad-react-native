/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import { act, fireEvent, render } from '@testing-library/react-native';

jest.mock('react-native-reanimated', () => {
    const React = jest.requireActual('react');
    const { View } = jest.requireActual('react-native');
    return {
        __esModule: true,
        // withTiming must NOT invoke callbacks — the repeat-chain uses callbacks and
        // would loop infinitely with a synchronous-callback mock.
        default: {
            View,
            // Spread animatedProps onto the wrapped component; map `text` → `value` so
            // getByDisplayValue works in tests (mirrors Reanimated's native TextInput handling).
            createAnimatedComponent: (Component: React.ComponentType<Record<string, unknown>>) => {
                return ({ animatedProps, ...rest }: { animatedProps?: Record<string, unknown> }) => {
                    const { text, ...animatedRest } = animatedProps ?? {};
                    return React.createElement(Component, {
                        ...rest,
                        ...animatedRest,
                        ...(text !== undefined ? { value: String(text) } : {}),
                    });
                };
            },
        },
        // Stable across renders, like the real hook.
        useSharedValue: (v: unknown) => React.useRef({ value: v }).current,
        useAnimatedStyle: () => ({}),
        useAnimatedProps: (fn: () => Record<string, unknown>) => fn(),
        withTiming: (v: unknown) => v,
        withDelay: (_ms: number, v: unknown) => v,
        withSequence: (...vals: unknown[]) => vals[0],
        withRepeat: (v: unknown) => v,
        runOnJS: (fn: (...args: unknown[]) => unknown) => fn,
        Easing: {
            out: () => () => 0,
            in: () => () => 0,
            inOut: () => () => 0,
            cubic: () => 0,
            quad: () => 0,
            sin: () => 0,
        },
    };
});

jest.mock('react-native-gesture-handler', () => ({
    __esModule: true,
    Gesture: {
        Pan: () => {
            const b: Record<string, (...args: unknown[]) => unknown> = {};
            const handlers: Record<string, unknown> = {};
            (globalThis as any).__dialPan = handlers;
            ['enabled', 'minDistance', 'onBegin', 'onUpdate', 'onEnd', 'onFinalize']
                .forEach((m) => { b[m] = (fn: unknown) => { handlers[m] = fn; return b; }; });
            return b;
        },
    },
    GestureDetector: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('react-native-svg', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Svg: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Circle: () => null,
    Line: () => null,
    Path: () => null,
}));

jest.mock('expo-haptics', () => ({
    impactAsync: jest.fn(),
    ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' },
}));

const mockReportMiss = jest.fn();
const mockReportSuccess = jest.fn();
jest.mock('../../GestureNudgeContext', () => ({
    useGestureNudge: () => ({ nudgeMessage: null, reportMiss: mockReportMiss, reportSuccess: mockReportSuccess, hideNudge: () => {} }),
}));

import { InteractionType } from '../InteractionType';

import DialControl, { getCenterValueFontScale } from './DialControl';

const defaultProps = {
    value: 0,
    previousTotal: 10,
    onChange: jest.fn(),
    onToggleMode: jest.fn(),
    isSecondary: false,
    ink: '#000',
    addendOne: 1,
    addendTwo: 10,
    dialSize: 200,
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
});

describe('getCenterValueFontScale', () => {
    it('keeps short signed values at full size', () => {
        expect(getCenterValueFontScale(5)).toBe(1);
        expect(getCenterValueFontScale(-3)).toBe(1);
        expect(getCenterValueFontScale(999)).toBe(1);
    });

    it('shrinks positive four-digit values so the sign and digits fit', () => {
        expect(getCenterValueFontScale(1000)).toBeLessThan(1);
    });

    it('does not shrink below the minimum scale for very long values', () => {
        expect(getCenterValueFontScale(123456789)).toBe(0.62);
    });
});

describe('DialControl — rendering', () => {
    it('shows the current round score in the dial center', () => {
        const { getByTestId } = render(<DialControl {...defaultProps} value={5} />);
        expect(getByTestId('dial-round-value')).toHaveTextContent('+5');
    });

    it('shows a negative value correctly', () => {
        const { getByTestId } = render(<DialControl {...defaultProps} value={-3} />);
        expect(getByTestId('dial-round-value')).toHaveTextContent('-3');
    });

    it('shows addendOne on both buttons', () => {
        const { getByText } = render(<DialControl {...defaultProps} addendOne={3} />);
        expect(getByText('−3')).toBeTruthy();
        expect(getByText('+3')).toBeTruthy();
    });

    it('shows NEW TOTAL as previous total plus this round', () => {
        const { getByTestId, getByText } = render(<DialControl {...defaultProps} previousTotal={40} value={2} />);
        expect(getByTestId('dial-new-total')).toHaveTextContent('42');
        expect(getByText('NEW TOTAL')).toBeTruthy();
    });

    it('shows the STEP pill with addendOne by default', () => {
        const { getByText } = render(<DialControl {...defaultProps} addendOne={2} />);
        expect(getByText('STEP +2')).toBeTruthy();
    });

    it('shows addendTwo in the pill when isSecondary=true', () => {
        const { getByText } = render(
            <DialControl {...defaultProps} isSecondary addendOne={1} addendTwo={10} />
        );
        expect(getByText('STEP +10')).toBeTruthy();
    });

    it('hides the pill in landscape mode', () => {
        const { queryByText } = render(<DialControl {...defaultProps} landscape />);
        expect(queryByText(/STEP/)).toBeNull();
    });

    it('hides NEW TOTAL in landscape mode', () => {
        const { queryByText } = render(<DialControl {...defaultProps} landscape />);
        expect(queryByText('NEW TOTAL')).toBeNull();
    });
});

describe('DialControl — button taps', () => {
    it('calls onChange with value + addendOne on + tap', () => {
        const onChange = jest.fn();
        const { getByTestId } = render(<DialControl {...defaultProps} value={5} addendOne={1} onChange={onChange} />);
        fireEvent.press(getByTestId('btn-increment'));
        expect(onChange).toHaveBeenCalledWith(6);
    });

    it('calls onChange with value - addendOne on − tap', () => {
        const onChange = jest.fn();
        const { getByTestId } = render(<DialControl {...defaultProps} value={5} addendOne={1} onChange={onChange} />);
        fireEvent.press(getByTestId('btn-decrement'));
        expect(onChange).toHaveBeenCalledWith(4);
    });

    it('respects a custom addendOne', () => {
        const onChange = jest.fn();
        const { getByTestId } = render(<DialControl {...defaultProps} value={0} addendOne={5} onChange={onChange} />);
        fireEvent.press(getByTestId('btn-increment'));
        expect(onChange).toHaveBeenCalledWith(5);
    });
});

describe('DialControl — menuOpen', () => {
    it('disables both buttons when menuOpen is true', () => {
        const { getByTestId } = render(<DialControl {...defaultProps} menuOpen />);
        expect(getByTestId('btn-decrement').props.accessibilityState?.disabled).toBe(true);
        expect(getByTestId('btn-increment').props.accessibilityState?.disabled).toBe(true);
    });

    it('enables both buttons when menuOpen is false', () => {
        const { getByTestId } = render(<DialControl {...defaultProps} menuOpen={false} />);
        expect(getByTestId('btn-decrement').props.accessibilityState?.disabled).toBeFalsy();
        expect(getByTestId('btn-increment').props.accessibilityState?.disabled).toBeFalsy();
    });
});

describe('DialControl misfire nudge', () => {
    const pan = () => (globalThis as any).__dialPan as Record<string, (e?: unknown) => void>;

    it('reports a miss when the ring is tapped without turning', () => {
        render(<DialControl {...defaultProps} />);
        pan().onBegin({ x: 100, y: 28 });
        pan().onEnd();
        pan().onFinalize();
        expect(mockReportMiss).toHaveBeenCalledTimes(1);
        expect(mockReportMiss).toHaveBeenCalledWith(InteractionType.Dial);
    });

    it('does not report a miss after a turn that scores', () => {
        const onChange = jest.fn();
        render(<DialControl {...defaultProps} onChange={onChange} />);
        pan().onBegin({ x: 100, y: 28 });
        pan().onUpdate({ x: 172, y: 100 });
        pan().onEnd();
        expect(onChange).toHaveBeenCalled();
        expect(mockReportSuccess).toHaveBeenCalled();
        expect(mockReportMiss).not.toHaveBeenCalled();
    });

    it('does not report a miss while hold mode is on', () => {
        render(<DialControl {...defaultProps} isSecondary />);
        pan().onBegin({ x: 100, y: 28 });
        pan().onEnd();
        expect(mockReportMiss).not.toHaveBeenCalled();
    });
});

describe('DialControl — turning keeps the score math consistent', () => {
    const pan = () => (globalThis as any).__dialPan as Record<string, (e?: unknown) => void>;
    // dialSize 200 → centre (100, 100), ring radius 72. One notch is 30°.
    const TOP = { x: 100, y: 28 };
    const ONE_NOTCH_CCW = { x: 64, y: 37.65 };
    const ONE_NOTCH_CW = { x: 136, y: 37.65 };

    const turn = (to: { x: number; y: number }) => {
        act(() => {
            pan().onBegin(TOP);
            pan().onUpdate(to);
        });
    };
    const release = () => {
        act(() => {
            pan().onEnd();
            pan().onFinalize();
        });
    };

    it('starts a turn from the saved round score, not from zero', () => {
        // Regression: the row showed 0 + 6 = 6 while the dial showed +5 this
        // round and a new total of 1 after turning back one notch.
        const onChange = jest.fn();
        const { getByTestId } = render(
            <DialControl {...defaultProps} value={6} previousTotal={0} onChange={onChange} />
        );

        turn(ONE_NOTCH_CCW);
        expect(getByTestId('dial-round-value')).toHaveTextContent('+5');
        expect(getByTestId('dial-new-total')).toHaveTextContent('5');

        release();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith(5);
    });

    it('keeps new total equal to previous total plus this round while turning', () => {
        const { getByTestId } = render(<DialControl {...defaultProps} value={3} previousTotal={12} />);
        turn({ x: 172, y: 100 }); // three notches clockwise
        expect(getByTestId('dial-round-value')).toHaveTextContent('+6');
        expect(getByTestId('dial-new-total')).toHaveTextContent('18');
    });

    it('builds on the last turn even before the saved score comes back', () => {
        const onChange = jest.fn();
        render(<DialControl {...defaultProps} value={0} onChange={onChange} />);

        turn(ONE_NOTCH_CW);
        release();
        turn(ONE_NOTCH_CW);
        release();

        expect(onChange).toHaveBeenNthCalledWith(1, 1);
        expect(onChange).toHaveBeenNthCalledWith(2, 2);
    });

    it('shows the saved score again after a turn that changes nothing', () => {
        const onChange = jest.fn();
        const { getByTestId } = render(<DialControl {...defaultProps} value={4} onChange={onChange} />);
        turn(ONE_NOTCH_CW);
        act(() => { pan().onUpdate(TOP); });
        release();
        expect(onChange).not.toHaveBeenCalled();
        expect(getByTestId('dial-round-value')).toHaveTextContent('+4');
    });

    it('follows the saved score when it changes', () => {
        const { getByTestId, rerender } = render(<DialControl {...defaultProps} value={2} previousTotal={5} />);
        rerender(<DialControl {...defaultProps} value={9} previousTotal={5} />);
        expect(getByTestId('dial-round-value')).toHaveTextContent('+9');
        expect(getByTestId('dial-new-total')).toHaveTextContent('14');
    });

    it('steps the buttons from the latest value, not a stale one', () => {
        const onChange = jest.fn();
        const { getByTestId } = render(<DialControl {...defaultProps} value={5} onChange={onChange} />);
        fireEvent.press(getByTestId('btn-increment'));
        fireEvent.press(getByTestId('btn-increment'));
        expect(onChange).toHaveBeenNthCalledWith(1, 6);
        expect(onChange).toHaveBeenNthCalledWith(2, 7);
    });
});
