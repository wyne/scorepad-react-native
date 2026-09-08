import React from 'react';

import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render } from '@testing-library/react-native';
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

jest.mock('@expo/ui/swift-ui', () => {
    const { Pressable, Text, View } = jest.requireActual('react-native');

    return {
        Host: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
            <View testID={testID}>{children}</View>
        ),
        Menu: ({ children }: { children: React.ReactNode }) => (
            <View testID="player-count-menu">{children}</View>
        ),
        Button: ({ label, onPress }: { label: string; onPress: () => void }) => (
            <Pressable accessibilityLabel={label} onPress={onPress}><Text>{label}</Text></Pressable>
        ),
        Image: () => null,
    };
});

jest.mock('@expo/ui/swift-ui/modifiers', () => ({
    buttonBorderShape: jest.fn(),
    buttonStyle: jest.fn(),
    frame: jest.fn(),
    tint: jest.fn(),
}));

// Read through a getter: the component reads LIQUID_GLASS at render time, so
// each test can pick the material without reloading the module graph.
let mockLiquidGlass = false;

jest.mock('../platform', () => ({
    get LIQUID_GLASS() {
        return mockLiquidGlass;
    },
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
        mockLiquidGlass = false;
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

    it.each([
        ['liquid glass', true],
        ['the flat fallback', false],
    ])('renders the add button on %s', (_material, available) => {
        mockLiquidGlass = available;

        const { getByTestId } = render(
            <Provider store={createMockStore()}>
                <FloatingActionButton navigation={mockNavigation} />
            </Provider>
        );

        expect(getByTestId('add-game-button')).toBeTruthy();
    });

    it('dismisses the keyboard when a player count is picked on liquid glass', () => {
        mockLiquidGlass = true;

        const { getByLabelText } = render(
            <Provider store={createMockStore()}>
                <FloatingActionButton navigation={mockNavigation} />
            </Provider>
        );

        fireEvent.press(getByLabelText('2 Players'));

        expect(Keyboard.dismiss).toHaveBeenCalledTimes(1);
    });
});
