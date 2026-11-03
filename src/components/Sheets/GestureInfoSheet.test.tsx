import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../../redux/GamesSlice';
import playersReducer from '../../../redux/PlayersSlice';
import settingsReducer, { initialState as settingsInitialState } from '../../../redux/SettingsSlice';
import { InteractionType } from '../Interactions/InteractionType';

import GestureInfoSheet from './GestureInfoSheet';

jest.mock('../../Analytics', () => ({ logEvent: jest.fn() }));

jest.mock('@gorhom/bottom-sheet', () => {
    const { View, ScrollView } = jest.requireActual('react-native');
    const MockBottomSheetModal = (props: { children: React.ReactNode }) => (
        <View testID="bottom-sheet-modal">{props.children}</View>
    );
    return {
        __esModule: true,
        default: MockBottomSheetModal,
        BottomSheetModal: MockBottomSheetModal,
        BottomSheetScrollView: ({ children }: { children: React.ReactNode }) => <ScrollView>{children}</ScrollView>,
        BottomSheetBackdrop: () => null,
    };
});

jest.mock('../Interactions/GestureDemo', () => () => null);

const mockDismiss = jest.fn();
jest.mock('./GestureInfoSheetContext', () => ({
    useGestureInfoSheetContext: () => ({ current: { dismiss: mockDismiss } }),
}));

const mockPresentPointValues = jest.fn();
jest.mock('./PointValuesSheetContext', () => ({
    usePointValuesSheetContext: () => ({ current: { present: mockPresentPointValues } }),
}));

const createStore = (playerCount = 2) => {
    const ids = Array.from({ length: playerCount }, (_, i) => `p${i}`);
    return configureStore({
        reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
        preloadedState: {
            settings: { ...settingsInitialState, currentGameId: 'game-1', interactionType: InteractionType.SwipeVertical, addendOne: 2, addendTwo: 5 },
            games: { ids: ['game-1'], entities: { 'game-1': { id: 'game-1', title: 'Test', dateCreated: 0, roundCurrent: 0, roundTotal: 1, locked: false, playerIds: ids } } },
            players: { ids, entities: Object.fromEntries(ids.map(id => [id, { id, playerName: id, scores: [0] }])) },
        } as Parameters<typeof configureStore>[0]['preloadedState'],
    });
};

const renderSheet = (store = createStore()) => ({
    store,
    ...render(<Provider store={store}><GestureInfoSheet /></Provider>),
});

beforeEach(() => {
    mockDismiss.mockClear();
    mockPresentPointValues.mockClear();
});

describe('GestureInfoSheet', () => {
    it('opens on the active gesture with steps that use the point values', () => {
        const { getByText, getByTestId } = renderSheet();
        expect(getByTestId(`gesture-tab-${InteractionType.SwipeVertical}`).props.accessibilityState).toEqual({ selected: true });
        expect(getByText('Swipe up on a player\'s tile to add 2, down to subtract.')).toBeTruthy();
        expect(getByText('Current gesture')).toBeTruthy();
    });

    it('switches tabs and lets the player use that gesture', () => {
        const { getByText, getByTestId, store } = renderSheet();
        fireEvent.press(getByTestId(`gesture-tab-${InteractionType.Dial}`));
        expect(getByText('Tap a player\'s row to open their dial.')).toBeTruthy();

        fireEvent.press(getByText('Use Dial'));
        expect(store.getState().settings.interactionType).toBe(InteractionType.Dial);
        expect(store.getState().games.entities['game-1']?.interactionType).toBe(InteractionType.Dial);
        expect(mockDismiss).toHaveBeenCalled();
    });

    it('keeps tile gestures unavailable on boards that are dial-only', () => {
        const { getByText, getByTestId, store } = renderSheet(createStore(21));
        fireEvent.press(getByTestId(`gesture-tab-${InteractionType.HalfTap}`));
        fireEvent.press(getByText('Up to 20 players'));
        expect(store.getState().settings.interactionType).toBe(InteractionType.SwipeVertical);
    });

    it('opens Point Values from the values row', () => {
        const { getByText } = renderSheet();
        fireEvent.press(getByText('2 · hold 5 ›'));
        expect(mockPresentPointValues).toHaveBeenCalled();
        expect(mockDismiss).toHaveBeenCalled();
    });
});
