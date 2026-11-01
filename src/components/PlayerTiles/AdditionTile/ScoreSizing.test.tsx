import React from 'react';

import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { withTiming } from 'react-native-reanimated';

import ScoreAfter from './ScoreAfter';
import ScoreBefore from './ScoreBefore';
import ScoreRound from './ScoreRound';

// Intentionally leave UI-thread styles unevaluated. Resizing must still put the
// correct font size into the React commit, without waiting for an animation.
jest.mock('react-native-reanimated', () => {
    const { useRef } = jest.requireActual('react');
    const { Text, View } = jest.requireActual('react-native');
    return {
        __esModule: true,
        default: { Text, View },
        useSharedValue: (value: number) => useRef({ value }).current,
        useAnimatedStyle: () => ({}),
        withTiming: jest.fn(value => value),
        ZoomIn: { duration: () => ({}) },
    };
});

describe('score text sizing', () => {
    beforeEach(() => jest.clearAllMocks());

    it('commits the previous-score font size with the new width before UI-thread styles run', () => {
        const score = (width: number) => <ScoreBefore containerWidth={width} currentRoundScore={0}
            currentRoundTotalScore={100} fontColor="#fff" />;
        const { getByText, rerender } = render(score(200));
        expect(StyleSheet.flatten(getByText('100').props.style).fontSize).toBe(48);

        jest.mocked(withTiming).mockClear();
        rerender(score(100));
        expect(StyleSheet.flatten(getByText('100').props.style).fontSize).toBe(24);
        expect(withTiming).not.toHaveBeenCalled();
    });

    it('commits the total-score font size with the new width without scheduling resize animations', () => {
        const score = (width: number) => <ScoreAfter containerWidth={width} currentRoundScore={5}
            currentRoundTotalScore={100} fontColor="#fff" />;
        const { getByText, rerender } = render(score(200));
        expect(StyleSheet.flatten(getByText('100').props.style).fontSize).toBe(44);

        jest.mocked(withTiming).mockClear();
        rerender(score(100));
        expect(StyleSheet.flatten(getByText('100').props.style).fontSize).toBe(22);
        expect(withTiming).not.toHaveBeenCalled();
    });

    it('still animates a score change after moving font layout to React', () => {
        const { rerender } = render(<ScoreBefore containerWidth={200} currentRoundScore={0}
            currentRoundTotalScore={100} fontColor="#fff" />);
        jest.mocked(withTiming).mockClear();

        rerender(<ScoreBefore containerWidth={200} currentRoundScore={5}
            currentRoundTotalScore={105} fontColor="#fff" />);
        expect(withTiming).toHaveBeenCalled();
    });

    it('keeps the round-score font size in the same React update', () => {
        const score = (width: number) => <ScoreRound containerWidth={width} currentRoundScore={5} fontColor="#fff" />;
        const { getByText, rerender } = render(score(200));
        expect(StyleSheet.flatten(getByText(/5/).props.style).fontSize).toBe(28);

        rerender(score(100));
        expect(StyleSheet.flatten(getByText(/5/).props.style).fontSize).toBe(14);
    });

    it('mounts fresh score text on resize, so no animated update can lag behind it', () => {
        const score = (width: number) => <ScoreAfter containerWidth={width} currentRoundScore={5}
            currentRoundTotalScore={100} fontColor="#fff" />;
        const { getByText, rerender } = render(score(200));
        const before = getByText('100');

        rerender(score(100));
        expect(getByText('100')).not.toBe(before);
    });

    it('keeps the same score text through a score change, so its size can animate', () => {
        const score = (round: number) => <ScoreBefore containerWidth={200} currentRoundScore={round}
            currentRoundTotalScore={100 + round} fontColor="#fff" />;
        const { getByText, rerender } = render(score(0));
        const before = getByText('100');

        rerender(score(5));
        expect(getByText('100')).toBe(before);
    });
});
