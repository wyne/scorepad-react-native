import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../../redux/GamesSlice';
import settingsReducer from '../../../redux/SettingsSlice';
import { FEATURE_DIAL_GESTURE, MAX_TILE_PLAYERS } from '../../constants';

jest.mock('expo-font');
jest.mock('../../Analytics');

// Capture onCloseMenu so tests can trigger it
let capturedOnCloseMenu: (() => void) | undefined;
let capturedActions: { id: string; subactions?: { id: string; attributes?: { disabled?: boolean } }[] }[] = [];
jest.mock('@react-native-menu/menu', () => {
    const { View } = jest.requireActual('react-native');
    return {
        MenuView: ({ children, onCloseMenu, testID, actions }: {
            children: React.ReactNode;
            onCloseMenu?: () => void;
            testID?: string;
            actions: typeof capturedActions;
        }) => {
            capturedOnCloseMenu = onCloseMenu;
            capturedActions = actions;
            return <View testID={testID}>{children}</View>;
        },
    };
});

jest.mock('expo-symbols', () => ({
    SymbolView: ({ name }: { name: string }) => {
        const { Text } = jest.requireActual('react-native');
        return <Text>{name}</Text>;
    },
}));

jest.mock('../MenuOpenContext', () => ({
    useMenuOpen: () => ({ menuOpen: false, setMenuOpen: jest.fn() }),
}));

jest.mock('../Sheets/PointValuesSheetContext', () => ({
    usePointValuesSheetContext: () => ({ current: null }),
}));

jest.mock('../Sheets/GameSheetContext', () => ({
    useGameSheetContext: () => ({ current: null }),
}));

jest.mock('../Sheets/GestureInfoSheetContext', () => ({
    useGestureInfoSheetContext: () => ({ current: null }),
}));

import GameOptionsButton from './GameOptionsButton';

const createStore = (seenFeatureNotifications: string[] = [], playerIds: string[] = ['p1']) =>
    configureStore({
        reducer: { settings: settingsReducer, games: gamesReducer },
        preloadedState: {
            settings: {
                currentGameId: 'game-1',
                interactionType: 'SwipeVertical',
                home_fullscreen: false,
                addendOne: 1,
                addendTwo: 10,
                seenFeatureNotifications,
            },
            games: {
                entities: {
                    'game-1': { id: 'game-1', playerIds, dateCreated: 0, roundCurrent: 0, roundTotal: 1 },
                },
                ids: ['game-1'],
            },
        } as Parameters<typeof configureStore>[0]['preloadedState'],
    });

describe('GameOptionsButton — dial notification dot', () => {
    it('shows dot when dial gesture is unseen', () => {
        const store = createStore([]);
        const { getByTestId } = render(
            <Provider store={store}><GameOptionsButton /></Provider>
        );
        expect(getByTestId('dial-notification-dot')).toBeTruthy();
    });

    it('hides dot when dial gesture is already seen', () => {
        const store = createStore([FEATURE_DIAL_GESTURE]);
        const { queryByTestId } = render(
            <Provider store={store}><GameOptionsButton /></Provider>
        );
        expect(queryByTestId('dial-notification-dot')).toBeNull();
    });

    it('marks dial gesture seen in store when menu closes (unseen)', () => {
        const store = createStore([]);
        render(<Provider store={store}><GameOptionsButton /></Provider>);
        capturedOnCloseMenu?.();
        expect(
            store.getState().settings.seenFeatureNotifications
        ).toContain(FEATURE_DIAL_GESTURE);
    });

    it('does not duplicate entry when menu closes and already seen', () => {
        const store = createStore([FEATURE_DIAL_GESTURE]);
        render(<Provider store={store}><GameOptionsButton /></Provider>);
        capturedOnCloseMenu?.();
        expect(
            store.getState().settings.seenFeatureNotifications.filter(
                (f: string) => f === FEATURE_DIAL_GESTURE
            ).length
        ).toBe(1);
    });
});

describe('GameOptionsButton — dial-only games', () => {
    const gestureAction = (id: string) =>
        capturedActions.flatMap(action => action.subactions ?? [action]).find(action => action.id === id);

    it('leaves swipe and tap enabled at the tile board limit', () => {
        const playerIds = Array.from({ length: MAX_TILE_PLAYERS }, (_, i) => `p${i}`);
        render(<Provider store={createStore([], playerIds)}><GameOptionsButton /></Provider>);
        expect(gestureAction('swipe')?.attributes?.disabled).toBeFalsy();
        expect(gestureAction('tap')?.attributes?.disabled).toBeFalsy();
    });

    it('disables swipe and tap above the tile board limit', () => {
        const playerIds = Array.from({ length: MAX_TILE_PLAYERS + 1 }, (_, i) => `p${i}`);
        render(<Provider store={createStore([], playerIds)}><GameOptionsButton /></Provider>);
        expect(gestureAction('swipe')?.attributes?.disabled).toBe(true);
        expect(gestureAction('tap')?.attributes?.disabled).toBe(true);
        expect(gestureAction('dial')?.attributes?.disabled).toBeFalsy();
    });
});
