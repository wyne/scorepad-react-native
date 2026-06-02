/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import { act, fireEvent, render } from '@testing-library/react-native';

import { POWER_HOLD_ACTIVATION_MS } from '../interactionConstants';

jest.mock('react-native-reanimated', () => {
    const { View } = jest.requireActual('react-native');
    return {
        __esModule: true,
        // withTiming must NOT invoke callbacks — the repeat-chain uses callbacks and
        // would loop infinitely with a synchronous-callback mock.
        default: { View, createAnimatedComponent: (c: unknown) => c },
        useSharedValue: (v: unknown) => ({ value: v }),
        useAnimatedStyle: () => ({}),
        useAnimatedProps: () => ({}),
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
            const fluent = () => b;
            ['enabled', 'minDistance', 'onBegin', 'onUpdate', 'onEnd', 'onFinalize']
                .forEach((m) => { b[m] = fluent; });
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

import DialControl from './DialControl';

const defaultProps = {
    value: 0,
    onChange: jest.fn(),
    onToggleMode: jest.fn(),
    isSecondary: false,
    ink: '#000',
    newTotal: 10,
    addendOne: 1,
    addendTwo: 10,
    dialSize: 200,
};

beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
});

describe('DialControl — rendering', () => {
    it('shows the current round score in the dial center', () => {
        const { getByText } = render(<DialControl {...defaultProps} value={5} />);
        expect(getByText('+5')).toBeTruthy();
    });

    it('shows a negative value correctly', () => {
        const { getByText } = render(<DialControl {...defaultProps} value={-3} />);
        expect(getByText('-3')).toBeTruthy();
    });

    it('shows addendOne on both buttons', () => {
        const { getByText } = render(<DialControl {...defaultProps} addendOne={3} />);
        expect(getByText('−3')).toBeTruthy();
        expect(getByText('+3')).toBeTruthy();
    });

    it('shows NEW TOTAL value', () => {
        const { getByText } = render(<DialControl {...defaultProps} newTotal={42} />);
        expect(getByText('42')).toBeTruthy();
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

describe('DialControl — button quick taps', () => {
    it('calls onChange with value + addendOne on quick + tap', () => {
        const onChange = jest.fn();
        const { getByTestId } = render(<DialControl {...defaultProps} value={5} addendOne={1} onChange={onChange} />);
        fireEvent(getByTestId('btn-increment'), 'pressIn');
        fireEvent(getByTestId('btn-increment'), 'pressOut');
        expect(onChange).toHaveBeenCalledWith(6);
    });

    it('calls onChange with value - addendOne on quick − tap', () => {
        const onChange = jest.fn();
        const { getByTestId } = render(<DialControl {...defaultProps} value={5} addendOne={1} onChange={onChange} />);
        fireEvent(getByTestId('btn-decrement'), 'pressIn');
        fireEvent(getByTestId('btn-decrement'), 'pressOut');
        expect(onChange).toHaveBeenCalledWith(4);
    });

    it('respects a custom addendOne on quick tap', () => {
        const onChange = jest.fn();
        const { getByTestId } = render(<DialControl {...defaultProps} value={0} addendOne={5} onChange={onChange} />);
        fireEvent(getByTestId('btn-increment'), 'pressIn');
        fireEvent(getByTestId('btn-increment'), 'pressOut');
        expect(onChange).toHaveBeenCalledWith(5);
    });
});

describe('DialControl — long press (power hold)', () => {
    it('fires onChange with addendTwo after POWER_HOLD_ACTIVATION_MS on + hold', () => {
        jest.useFakeTimers();
        const onChange = jest.fn();
        const { getByTestId } = render(
            <DialControl {...defaultProps} value={0} addendOne={1} addendTwo={10} onChange={onChange} />
        );
        fireEvent(getByTestId('btn-increment'), 'pressIn');
        act(() => { jest.advanceTimersByTime(POWER_HOLD_ACTIVATION_MS); });
        expect(onChange).toHaveBeenCalledWith(10);
    });

    it('fires onChange with -addendTwo after POWER_HOLD_ACTIVATION_MS on − hold', () => {
        jest.useFakeTimers();
        const onChange = jest.fn();
        const { getByTestId } = render(
            <DialControl {...defaultProps} value={0} addendOne={1} addendTwo={10} onChange={onChange} />
        );
        fireEvent(getByTestId('btn-decrement'), 'pressIn');
        act(() => { jest.advanceTimersByTime(POWER_HOLD_ACTIVATION_MS); });
        expect(onChange).toHaveBeenCalledWith(-10);
    });

    it('does not fire addendTwo when released before POWER_HOLD_ACTIVATION_MS', () => {
        jest.useFakeTimers();
        const onChange = jest.fn();
        const { getByTestId } = render(
            <DialControl {...defaultProps} value={0} addendOne={1} addendTwo={10} onChange={onChange} />
        );
        fireEvent(getByTestId('btn-increment'), 'pressIn');
        act(() => { jest.advanceTimersByTime(POWER_HOLD_ACTIVATION_MS - 1); });
        fireEvent(getByTestId('btn-increment'), 'pressOut');
        // Released before threshold → addendOne only
        expect(onChange).toHaveBeenCalledWith(1);
        expect(onChange).not.toHaveBeenCalledWith(10);
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
