/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import TotalScoreCell from './TotalScoreCell';

const stub = function (s: any = {}) { return s; };

const renderCell = (scores: number[]) => {
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
            <TotalScoreCell playerId="player-1" />
        </Provider>
    );
};

describe('TotalScoreCell', () => {
    it('renders the grand total across all rounds', () => {
        const { getByText } = renderCell([10, 20, 30]);
        expect(getByText('60')).toBeTruthy();
    });

    it('renders a negative grand total', () => {
        const { getByText } = renderCell([10, -25, 5]);
        expect(getByText('-10')).toBeTruthy();
    });

    it('renders 0 for a player with no scores', () => {
        const { getByText } = renderCell([]);
        expect(getByText('0')).toBeTruthy();
    });
});
