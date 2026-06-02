import React from 'react';

import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import RadialGesture from './RadialGesture';

describe('RadialGesture', () => {
    it('renders children', () => {
        const { getByText } = render(
            <RadialGesture fontColor="white" index={0} playerId="player-1">
                <Text>child content</Text>
            </RadialGesture>
        );
        expect(getByText('child content')).toBeTruthy();
    });

    it('renders without crashing when children is an empty fragment', () => {
        const { toJSON } = render(
            <RadialGesture fontColor="#abc" index={2} playerId="player-2">
                <></>
            </RadialGesture>
        );
        expect(toJSON()).toBeNull();
    });
});
