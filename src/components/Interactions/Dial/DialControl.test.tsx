/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import { fireEvent, render } from '@testing-library/react-native';
import { SharedValue } from 'react-native-reanimated';

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

// Creates a mock SharedValue matching the shape returned by the Reanimated mock
const mkSv = <T,>(v: T) => ({ value: v }) as unknown as SharedValue<T>;

const defaultProps = {
    svValue: mkSv(0),
    onChange: jest.fn(),
    onToggleMode: jest.fn(),
    isSecondary: false,
    ink: '#000',
    svNewTotal: mkSv(10),
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
        const { getByDisplayValue } = render(<DialControl {...defaultProps} svValue={mkSv(5)} />);
        expect(getByDisplayValue('+5')).toBeTruthy();
    });

    it('shows a negative value correctly', () => {
        const { getByDisplayValue } = render(<DialControl {...defaultProps} svValue={mkSv(-3)} />);
        expect(getByDisplayValue('-3')).toBeTruthy();
    });

    it('shows addendOne on both buttons', () => {
        const { getByText } = render(<DialControl {...defaultProps} addendOne={3} />);
        expect(getByText('−3')).toBeTruthy();
        expect(getByText('+3')).toBeTruthy();
    });

    it('shows NEW TOTAL value', () => {
        const { getByDisplayValue, getByText } = render(<DialControl {...defaultProps} svNewTotal={mkSv(42)} />);
        expect(getByDisplayValue('42')).toBeTruthy();
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
        const { getByTestId } = render(<DialControl {...defaultProps} svValue={mkSv(5)} addendOne={1} onChange={onChange} />);
        fireEvent.press(getByTestId('btn-increment'));
        expect(onChange).toHaveBeenCalledWith(6);
    });

    it('calls onChange with value - addendOne on − tap', () => {
        const onChange = jest.fn();
        const { getByTestId } = render(<DialControl {...defaultProps} svValue={mkSv(5)} addendOne={1} onChange={onChange} />);
        fireEvent.press(getByTestId('btn-decrement'));
        expect(onChange).toHaveBeenCalledWith(4);
    });

    it('respects a custom addendOne', () => {
        const onChange = jest.fn();
        const { getByTestId } = render(<DialControl {...defaultProps} svValue={mkSv(0)} addendOne={5} onChange={onChange} />);
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
