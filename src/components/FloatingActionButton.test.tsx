import React from 'react';

import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { configureStore } from '@reduxjs/toolkit';
import { act, render } from '@testing-library/react-native';
import { Keyboard } from 'react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer, { initialState as initialSettingsState } from '../../redux/SettingsSlice';

import FloatingActionButton from './FloatingActionButton';

jest.mock('expo-crypto', () => ({
    randomUUID: jest.fn(() => 'mock-uuid'),
}));

jest.mock('../Analytics', () => ({
    logEvent: jest.fn(),
}));

jest.mock('../ColorPalette', () => ({
    getPalette: jest.fn(() => ['#ffffff']),
}));

jest.mock('react-native-elements', () => ({
    Icon: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

let capturedOnOpenMenu: (() => void) | undefined;
let capturedOnPressAction: ((event: { nativeEvent: { event: string } }) => void) | undefined;

jest.mock('@react-native-menu/menu', () => {
    const { View } = jest.requireActual('react-native');

    return {
        MenuView: ({ children, onOpenMenu, onPressAction }: {
            children: React.ReactNode;
            onOpenMenu?: () => void;
            onPressAction?: (event: { nativeEvent: { event: string } }) => void;
        }) => {
            capturedOnOpenMenu = onOpenMenu;
            capturedOnPressAction = onPressAction;
            return <View testID="player-count-menu">{children}</View>;
        },
    };
});

const createMockStore = () => configureStore({
    reducer: {
        settings: settingsReducer,
        games: gamesReducer,
        players: playersReducer,
    },
    preloadedState: {
        settings: {
            ...initialSettingsState,
            currentGameId: undefined,
        },
        games: {
            entities: {},
            ids: [],
        },
        players: {
            entities: {},
            ids: [],
        },
    },
});

const mockNavigation = {
    navigate: jest.fn(),
} as unknown as NativeStackNavigationProp<ParamListBase, string, undefined>;

describe('FloatingActionButton', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        capturedOnOpenMenu = undefined;
        capturedOnPressAction = undefined;
        jest.spyOn(Keyboard, 'dismiss').mockImplementation(() => undefined);
    });

    it('dismisses the keyboard when the player count menu opens', () => {
        render(
            <Provider store={createMockStore()}>
                <FloatingActionButton navigation={mockNavigation} />
            </Provider>
        );

        capturedOnOpenMenu?.();

        expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
    });

    it('dismisses the keyboard before creating a game from the menu', async () => {
        render(
            <Provider store={createMockStore()}>
                <FloatingActionButton navigation={mockNavigation} />
            </Provider>
        );

        await act(async () => {
            capturedOnPressAction?.({ nativeEvent: { event: '2' } });
        });

        expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
    });
});
