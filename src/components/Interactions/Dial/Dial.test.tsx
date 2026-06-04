import React from 'react';

import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import Dial from './Dial';

describe('Dial', () => {
    it('renders children', () => {
        const { getByText } = render(
            <Dial fontColor="white" index={0} playerId="player-1">
                <Text>child content</Text>
            </Dial>
        );
        expect(getByText('child content')).toBeTruthy();
    });

    it('renders without crashing when children is an empty fragment', () => {
        const { toJSON } = render(
            <Dial fontColor="#abc" index={2} playerId="player-2">
                <></>
            </Dial>
        );
        expect(toJSON()).toBeNull();
    });
});
