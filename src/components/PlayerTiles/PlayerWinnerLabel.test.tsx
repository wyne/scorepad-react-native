import React from 'react';

import { render } from '@testing-library/react-native';

import PlayerWinnerLabel from './PlayerWinnerLabel';

describe('PlayerWinnerLabel', () => {
    it('should return null when disabled', () => {
        const { toJSON } = render(
            <PlayerWinnerLabel fontColor="#FFFFFF" enabled={false} />
        );

        expect(toJSON()).toBeNull();
    });

    it('should render when enabled', () => {
        const { getByText } = render(
            <PlayerWinnerLabel fontColor="#FFD700" enabled={true} />
        );

        expect(getByText('WINNER')).toBeTruthy();
    });

    it('should render with the correct font color', () => {
        const { getByText } = render(
            <PlayerWinnerLabel fontColor="#FFD700" enabled={true} />
        );

        const textElement = getByText('WINNER');
        expect(textElement.props.style).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ color: '#FFD700' }),
            ])
        );
    });
});
