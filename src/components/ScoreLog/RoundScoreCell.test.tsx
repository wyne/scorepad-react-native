/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import RoundScoreCell from './RoundScoreCell';

const stub = function (s: any = {}) { return s; };

const renderCell = (scores: number[], round: number) => {
    const store = configureStore({
        reducer: { settings: stub, games: stub, players: stub },
        preloadedState: {
            settings: { colorScheme: 'system', _persist: { version: 0, rehydrated: true } },
            games: { ids: [], entities: {}, _persist: { version: 0, rehydrated: true } },
            players: { ids: ['player-1'], entities: { 'player-1': { id: 'player-1', playerName: 'Test', scores } }, _persist: { version: 0, rehydrated: true } },
        },
    });
    return render(
        <Provider store={store}>
            <RoundScoreCell playerId="player-1" round={round} playerIndex={0} />
        </Provider>
    );
};

describe('RoundScoreCell', () => {
    it('renders the score for the requested round', () => {
        const { getByText } = renderCell([10, 20, 30], 1);
        expect(getByText('20')).toBeTruthy();
    });

    it('renders a negative round score', () => {
        const { getByText } = renderCell([10, -5], 1);
        expect(getByText('-5')).toBeTruthy();
    });

    it('renders 0 for a round beyond the scores length', () => {
        const { getByText } = renderCell([10], 4);
        expect(getByText('0')).toBeTruthy();
    });
});
