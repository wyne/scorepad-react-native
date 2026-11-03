import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer, { initialState as settingsInitialState, setLastUsedInteractionType } from '../../redux/SettingsSlice';

import GestureHintToast from './GestureHintToast';
import { InteractionType } from './Interactions/InteractionType';

jest.mock('../Analytics', () => ({ logEvent: jest.fn() }));

jest.mock('react-native-reanimated', () => {
    const { View } = jest.requireActual('react-native');
    return {
        __esModule: true,
        default: { View },
        FadeIn: { duration: jest.fn() },
        FadeOut: { duration: jest.fn() },
    };
});

jest.mock('./Interactions/GestureDemo', () => () => null);

const mockPresent = jest.fn();
jest.mock('./Sheets/GestureInfoSheetContext', () => ({
    useGestureInfoSheetContext: () => ({ current: { present: mockPresent } }),
}));

let mockLockedHintVisible = false;
jest.mock('./LockedHintContext', () => ({
    useLockedHint: () => ({ lockedHintVisible: mockLockedHintVisible, showLockedHint: () => {}, hideLockedHint: () => {} }),
}));

let mockNudge: string | null = null;
jest.mock('./GestureNudgeContext', () => ({
    useGestureNudge: () => ({ nudgeMessage: mockNudge, reportMiss: () => {}, hideNudge: () => {} }),
}));

const createStore = ({ interactionType = InteractionType.SwipeVertical, lastUsed, locked = false }: {
    interactionType?: InteractionType; lastUsed?: InteractionType; locked?: boolean;
} = {}) => configureStore({
    reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
    preloadedState: {
        settings: { ...settingsInitialState, currentGameId: 'game-1', interactionType, lastUsedInteractionType: lastUsed, addendOne: 2, addendTwo: 5 },
        games: { ids: ['game-1'], entities: { 'game-1': { id: 'game-1', title: 'Test', dateCreated: 0, roundCurrent: 0, roundTotal: 1, locked, playerIds: ['p1'] } } },
        players: { ids: ['p1'], entities: { p1: { id: 'p1', playerName: 'P1', scores: [0] } } },
    } as Parameters<typeof configureStore>[0]['preloadedState'],
});

const renderToast = (store = createStore()) => ({
    store,
    ...render(<Provider store={store}><GestureHintToast top={8} /></Provider>),
});

beforeEach(() => {
    mockPresent.mockClear();
    mockLockedHintVisible = false;
    mockNudge = null;
});

describe('GestureHintToast', () => {
    it('teaches a new player the active gesture with the real point values', () => {
        const { getByText } = renderToast();
        expect(getByText('Swipe to score')).toBeTruthy();
        expect(getByText('Swipe a tile up to add 2, down to subtract. Swipe farther for more.')).toBeTruthy();
    });

    it('explains tap and dial too', () => {
        expect(renderToast(createStore({ interactionType: InteractionType.HalfTap })).getByText('Tap to score')).toBeTruthy();
        expect(renderToast(createStore({ interactionType: InteractionType.Dial })).getByText('Tap a player to score')).toBeTruthy();
    });

    it('stays hidden once the gesture has been used', () => {
        const { queryByTestId } = renderToast(createStore({ lastUsed: InteractionType.SwipeVertical }));
        expect(queryByTestId('gesture-hint-toast')).toBeNull();
    });

    it('goes away when the gesture is first used', () => {
        const { store, queryByTestId } = renderToast();
        expect(queryByTestId('gesture-hint-toast')).toBeTruthy();
        act(() => { store.dispatch(setLastUsedInteractionType(InteractionType.SwipeVertical)); });
        expect(queryByTestId('gesture-hint-toast')).toBeNull();
    });

    it('hides on Got it', () => {
        const { getByTestId, queryByTestId } = renderToast();
        fireEvent.press(getByTestId('gesture-hint-got-it'));
        expect(queryByTestId('gesture-hint-toast')).toBeNull();
    });

    it('opens How to Score from How it works', () => {
        const { getByTestId, queryByTestId } = renderToast();
        fireEvent.press(getByTestId('gesture-hint-how'));
        expect(mockPresent).toHaveBeenCalled();
        expect(queryByTestId('gesture-hint-toast')).toBeNull();
    });

    it('never shows in a locked game', () => {
        const { queryByTestId } = renderToast(createStore({ locked: true }));
        expect(queryByTestId('gesture-hint-toast')).toBeNull();
    });

    it('steps aside for the locked hint and the nudge', () => {
        mockLockedHintVisible = true;
        expect(renderToast().queryByTestId('gesture-hint-toast')).toBeNull();
        mockLockedHintVisible = false;
        mockNudge = 'Swipe up or down to change a score.';
        expect(renderToast().queryByTestId('gesture-hint-toast')).toBeNull();
    });
});
