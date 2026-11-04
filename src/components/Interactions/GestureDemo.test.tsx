import React from 'react';

import { render } from '@testing-library/react-native';

import GestureDemo from './GestureDemo';
import { InteractionType } from './InteractionType';

jest.mock('react-native-reanimated', () => {
    const { View, Text } = jest.requireActual('react-native');
    return {
        __esModule: true,
        default: { View, Text },
        Easing: { inOut: () => () => 0, quad: () => 0 },
        cancelAnimation: jest.fn(),
        useAnimatedStyle: (fn: () => object) => fn(),
        useReducedMotion: jest.fn(() => false),
        useSharedValue: (v: unknown) => ({ value: v }),
        withDelay: (_ms: number, v: unknown) => v,
        withRepeat: (v: unknown) => v,
        withSequence: (...v: unknown[]) => v[0],
        withTiming: (v: unknown) => v,
    };
});

describe('GestureDemo', () => {
    it.each([InteractionType.SwipeVertical, InteractionType.HalfTap, InteractionType.Dial])('draws the %s demo with its score', (type) => {
        const { getByTestId, getByText } = render(
            <GestureDemo interactionType={type} width={52} height={66} color="#01497C" label="+3" testID="demo" />,
        );
        expect(getByTestId('demo', { includeHiddenElements: true })).toBeTruthy();
        expect(getByText('+3', { includeHiddenElements: true })).toBeTruthy();
    });
});
