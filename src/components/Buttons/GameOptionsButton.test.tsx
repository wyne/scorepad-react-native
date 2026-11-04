import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../../redux/GamesSlice';
import settingsReducer from '../../../redux/SettingsSlice';
import { FEATURE_DIAL_GESTURE, MAX_TILE_PLAYERS } from '../../constants';

jest.mock('expo-font');
jest.mock('../../Analytics');

// Capture onCloseMenu so tests can trigger it
let capturedOnCloseMenu: (() => void) | undefined;
let capturedOnPressAction: ((e: { nativeEvent: { event: string } }) => void) | undefined;
type CapturedAction = { id: string; state?: string; subtitle?: string; attributes?: { disabled?: boolean }; subactions?: CapturedAction[] };
let capturedActions: CapturedAction[] = [];
jest.mock('@react-native-menu/menu', () => {
    const { View } = jest.requireActual('react-native');
    return {
        MenuView: ({ children, onCloseMenu, onPressAction, testID, actions }: {
            children: React.ReactNode;
            onCloseMenu?: () => void;
            onPressAction?: typeof capturedOnPressAction;
            testID?: string;
            actions: typeof capturedActions;
        }) => {
            capturedOnCloseMenu = onCloseMenu;
            capturedOnPressAction = onPressAction;
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

describe('GameOptionsButton — player numbers', () => {
    const findAction = (id: string, actions = capturedActions): CapturedAction | undefined => {
        for (const action of actions) {
            if (action.id === id) return action;
            const found = action.subactions && findAction(id, action.subactions);
            if (found) return found;
        }
        return undefined;
    };

    it('offers Off, Badge and Big in a submenu, checking the current style', () => {
        render(<Provider store={createStore()}><GameOptionsButton /></Provider>);
        const submenu = findAction('player-numbers');
        expect(submenu?.subtitle).toBe('Off');
        expect(submenu?.subactions?.map(a => [a.id, a.state])).toEqual([
            ['player-numbers-off', 'on'],
            ['player-numbers-badge', 'off'],
            ['player-numbers-big', 'off'],
        ]);
    });

    it('saves the choice on this game only, leaving the default for new games', () => {
        const store = createStore();
        const defaultBefore = store.getState().settings.playerNumbers;
        render(<Provider store={store}><GameOptionsButton /></Provider>);

        act(() => capturedOnPressAction?.({ nativeEvent: { event: 'player-numbers-big' } }));

        expect(store.getState().games.entities['game-1']?.playerNumbers).toBe('big');
        expect(store.getState().settings.playerNumbers).toBe(defaultBefore);
        expect(findAction('player-numbers-big')?.state).toBe('on');
    });
});
