import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../redux/GamesSlice';
import playersReducer from '../redux/PlayersSlice';
import settingsReducer, { initialState as settingsInitialState } from '../redux/SettingsSlice';

import { Navigation } from './Navigation';

type MockScreenListeners = {
    blur?: () => void;
    focus?: () => void;
    transitionStart?: (event: { data: { closing: boolean } }) => void;
};

type MockNavigationContainerProps = {
    children: React.ReactNode;
    onReady?: () => void;
    onStateChange?: () => void;
};

let mockActiveRouteName = 'List';
let mockNavigationContainerProps: MockNavigationContainerProps | undefined;
const mockScreenListeners: Record<string, MockScreenListeners | undefined> = {};

jest.mock('@react-navigation/native', () => {
    const actual = jest.requireActual('@react-navigation/native');
    const React = jest.requireActual('react');

    return {
        ...actual,
        NavigationContainer: React.forwardRef(({ children, onReady, onStateChange }: MockNavigationContainerProps, ref: React.Ref<{ getCurrentRoute: () => { name: string } }>) => {
            const { View } = jest.requireActual('react-native');

            mockNavigationContainerProps = { children, onReady, onStateChange };
            React.useImperativeHandle(ref, () => ({
                getCurrentRoute: () => ({ name: mockActiveRouteName }),
            }));

            return <View>{children}</View>;
        }),
    };
});

jest.mock('@react-navigation/native-stack', () => ({
    createNativeStackNavigator: () => ({
        Navigator: ({ children }: { children: React.ReactNode }) => {
            const { View } = jest.requireActual('react-native');
            return <View>{children}</View>;
        },
        Screen: ({ name, listeners }: { name: string; listeners?: MockScreenListeners }) => {
            mockScreenListeners[name] = listeners;
            return null;
        },
    }),
}));

jest.mock('./components/Buttons/AppSettingsButton', () => {
    return function MockAppSettingsButton() {
        return null;
    };
});

jest.mock('./components/Buttons/GameOptionsButton', () => {
    return function MockGameOptionsButton() {
        return null;
    };
});

jest.mock('./components/Headers/RoundHeaderTitle', () => {
    return function MockRoundHeaderTitle() {
        return null;
    };
});

jest.mock('./components/Sheets/GameSheet', () => {
    return function MockGameSheet() {
        const { View } = jest.requireActual('react-native');
        return <View testID="game-sheet" />;
    };
});

jest.mock('./screens/AppSettingsScreen', () => {
    return function MockAppSettingsScreen() {
        return null;
    };
});

jest.mock('./screens/DebugLogScreen', () => {
    return function MockDebugLogScreen() {
        return null;
    };
});

jest.mock('./screens/EditGameScreen', () => {
    return function MockEditGameScreen() {
        return null;
    };
});

jest.mock('./screens/EditPlayerScreen', () => {
    return function MockEditPlayerScreen() {
        return null;
    };
});

jest.mock('./screens/GameScreen', () => {
    return function MockGameScreen() {
        return null;
    };
});

jest.mock('./screens/ListScreen', () => {
    return function MockListScreen() {
        return null;
    };
});

jest.mock('./screens/ShareScreen', () => {
    return function MockShareScreen() {
        return null;
    };
});

const createMockStore = (homeFullscreen = false) => configureStore({
    reducer: {
        settings: settingsReducer,
        games: gamesReducer,
        players: playersReducer,
    },
    preloadedState: {
        settings: {
            ...settingsInitialState,
            home_fullscreen: homeFullscreen,
        },
    },
});

const renderNavigation = (homeFullscreen = false) => render(
    <Provider store={createMockStore(homeFullscreen)}>
        <Navigation />
    </Provider>
);

const getGameListeners = (): Required<MockScreenListeners> => {
    const listeners = mockScreenListeners.Game;

    if (!listeners?.blur || !listeners.focus || !listeners.transitionStart) {
        throw new Error('Game screen listeners were not captured.');
    }

    return listeners as Required<MockScreenListeners>;
};

const setActiveRoute = (routeName: string) => {
    mockActiveRouteName = routeName;

    act(() => {
        mockNavigationContainerProps?.onStateChange?.();
    });
};

describe('Navigation', () => {
    beforeEach(() => {
        mockActiveRouteName = 'List';
        mockNavigationContainerProps = undefined;
        Object.keys(mockScreenListeners).forEach((key) => {
            delete mockScreenListeners[key];
        });
    });

    it('shows and hides the game sheet from native stack lifecycle and route state events', () => {
        const { queryByTestId } = renderNavigation();
        const gameListeners = getGameListeners();

        expect(queryByTestId('game-sheet')).toBeNull();

        act(() => {
            gameListeners.focus();
        });

        expect(queryByTestId('game-sheet')).toBeTruthy();

        act(() => {
            gameListeners.transitionStart({ data: { closing: false } });
        });

        expect(queryByTestId('game-sheet')).toBeTruthy();

        act(() => {
            gameListeners.transitionStart({ data: { closing: true } });
        });

        expect(queryByTestId('game-sheet')).toBeNull();

        act(() => {
            gameListeners.focus();
        });

        expect(queryByTestId('game-sheet')).toBeTruthy();

        act(() => {
            gameListeners.blur();
        });

        expect(queryByTestId('game-sheet')).toBeNull();

        setActiveRoute('Game');

        expect(queryByTestId('game-sheet')).toBeTruthy();

        setActiveRoute('List');

        expect(queryByTestId('game-sheet')).toBeNull();

        setActiveRoute('Game');

        expect(queryByTestId('game-sheet')).toBeTruthy();

        setActiveRoute('EditGame');

        expect(queryByTestId('game-sheet')).toBeNull();

        setActiveRoute('Game');

        expect(queryByTestId('game-sheet')).toBeTruthy();

        setActiveRoute('Share');

        expect(queryByTestId('game-sheet')).toBeNull();
    });

    it('does not render the game sheet when fullscreen mode is enabled', () => {
        const { queryByTestId } = renderNavigation(true);

        setActiveRoute('Game');

        expect(queryByTestId('game-sheet')).toBeNull();
    });

    it('syncs the game sheet with the initial route when navigation is ready', () => {
        mockActiveRouteName = 'Game';

        const { queryByTestId } = renderNavigation();

        expect(queryByTestId('game-sheet')).toBeNull();

        act(() => {
            mockNavigationContainerProps?.onReady?.();
        });

        expect(queryByTestId('game-sheet')).toBeTruthy();
    });
});
