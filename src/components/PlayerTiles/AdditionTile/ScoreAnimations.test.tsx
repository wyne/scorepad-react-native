import React from 'react';

import { render } from '@testing-library/react-native';
import { withTiming } from 'react-native-reanimated';

import ScoreAfter from './ScoreAfter';
import ScoreBefore from './ScoreBefore';
import ScoreRound from './ScoreRound';

jest.mock('react-native-reanimated', () => {
    const { Text, View } = jest.requireActual('react-native');

    return {
        __esModule: true,
        default: {
            Text,
            View,
        },
        useAnimatedStyle: jest.fn((callback) => callback()),
        useSharedValue: jest.fn((value) => ({ value })),
        withTiming: jest.fn((value) => value),
    };
});

const mockedWithTiming = withTiming as jest.Mock;

describe('AdditionTile score animations', () => {
    beforeEach(() => {
        mockedWithTiming.mockClear();
    });

    it('renders initial zero scores without timing animations', () => {
        render(
            <>
                <ScoreBefore containerWidth={200} currentRoundScore={0} currentRoundTotalScore={10} fontColor="#fff" />
                <ScoreRound containerWidth={200} currentRoundScore={0} fontColor="#fff" />
                <ScoreAfter containerWidth={200} currentRoundScore={0} currentRoundTotalScore={10} fontColor="#fff" />
            </>
        );

        expect(mockedWithTiming).not.toHaveBeenCalled();
    });

    it('animates score values after the initial render', () => {
        const { rerender } = render(
            <>
                <ScoreBefore containerWidth={200} currentRoundScore={0} currentRoundTotalScore={10} fontColor="#fff" />
                <ScoreRound containerWidth={200} currentRoundScore={0} fontColor="#fff" />
                <ScoreAfter containerWidth={200} currentRoundScore={0} currentRoundTotalScore={10} fontColor="#fff" />
            </>
        );

        mockedWithTiming.mockClear();

        rerender(
            <>
                <ScoreBefore containerWidth={200} currentRoundScore={5} currentRoundTotalScore={15} fontColor="#fff" />
                <ScoreRound containerWidth={200} currentRoundScore={5} fontColor="#fff" />
                <ScoreAfter containerWidth={200} currentRoundScore={5} currentRoundTotalScore={15} fontColor="#fff" />
            </>
        );

        expect(mockedWithTiming).toHaveBeenCalled();
    });
});
