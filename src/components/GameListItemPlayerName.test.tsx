import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import playersReducer from '../../redux/PlayersSlice';
import settingsReducer from '../../redux/SettingsSlice';

import GameListItemPlayerName from './GameListItemPlayerName';

// Mock react-native-elements Icon
jest.mock('react-native-elements', () => {
    const { View, Text } = jest.requireActual('react-native');

    return {
        Icon: ({ name, color, style }: {
            name: string;
            color: string;
            style?: object;
        }) => (
            <View testID={`icon-${name}`} style={style}>
                <Text style={{ color }}>{name}</Text>
            </View>
        ),
    };
});

describe('GameListItemPlayerName', () => {
    const createMockStore = (players: Record<string, { id: string; playerName: string; scores: number[]; }>) => {
        return configureStore({
            reducer: {
                settings: settingsReducer,
                games: () => ({ entities: {}, ids: [] }),
                players: playersReducer,
            },
            preloadedState: {
                players: {
                    entities: players,
                    ids: Object.keys(players),
                },
            },
        });
    };

    it('should render player name', () => {
        const store = createMockStore({
            'player-1': { id: 'player-1', playerName: 'Alice', scores: [10] },
        });

        const { getByText } = render(
            <Provider store={store}>
                <GameListItemPlayerName playerId="player-1" />
            </Provider>
        );

        expect(getByText('Alice, ')).toBeTruthy();
    });

    it('should not show comma when last player', () => {
        const store = createMockStore({
            'player-1': { id: 'player-1', playerName: 'Alice', scores: [10] },
        });

        const { getByText } = render(
            <Provider store={store}>
                <GameListItemPlayerName playerId="player-1" last={true} />
            </Provider>
        );

        expect(getByText('Alice')).toBeTruthy();
    });

    it('should show trophy icon when isWinner is true', () => {
        const store = createMockStore({
            'player-1': { id: 'player-1', playerName: 'Alice', scores: [10] },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <GameListItemPlayerName playerId="player-1" isWinner={true} />
            </Provider>
        );

        expect(getByTestId('icon-trophy')).toBeTruthy();
    });

    it('should apply bold styling when isWinner is true', () => {
        const store = createMockStore({
            'player-1': { id: 'player-1', playerName: 'Alice', scores: [10] },
        });

        const { getByText } = render(
            <Provider store={store}>
                <GameListItemPlayerName playerId="player-1" isWinner={true} />
            </Provider>
        );

        const textElement = getByText('Alice, ');
        expect(textElement.props.style).toEqual(
            expect.arrayContaining([expect.objectContaining({ fontWeight: 'bold' })])
        );
    });

    it('should apply default color when isWinner is false', () => {
        const store = createMockStore({
            'player-1': { id: 'player-1', playerName: 'Alice', scores: [10] },
        });

        const { getByText } = render(
            <Provider store={store}>
                <GameListItemPlayerName playerId="player-1" isWinner={false} />
            </Provider>
        );

        const textElement = getByText('Alice, ');
        expect(textElement.props.style).toEqual(
            expect.objectContaining({ color: expect.any(String) })
        );
    });
});
