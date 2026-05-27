import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render } from '@testing-library/react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../../redux/GamesSlice';
import playersReducer from '../../../redux/PlayersSlice';
import settingsReducer from '../../../redux/SettingsSlice';
import * as Analytics from '../../Analytics';

import InteractionSelector from './InteractionSelector';
import { InteractionType } from './InteractionType';

// Mock external dependencies
jest.mock('../../Analytics');

// Mock the components that InteractionSelector uses
jest.mock('../BigButtons/BigButton', () => {
    return function MockBigButton({ 
        onPress, 
        text, 
        icon, 
        color, 
        animated 
    }: { 
        onPress: () => void; 
        text: string; 
        icon: React.ReactNode; 
        color: string; 
        animated: boolean;
    }) {
        const { TouchableOpacity, Text, View } = jest.requireActual('react-native');
        return (
            <TouchableOpacity onPress={onPress} testID={`big-button-${text.toLowerCase()}`}>
                <View>
                    <Text style={{ color }}>{text}</Text>
                    <Text>Animated: {animated.toString()}</Text>
                    <Text>Color: {color}</Text>
                    {icon}
                </View>
            </TouchableOpacity>
        );
    };
});

jest.mock('../Buttons/TapGestureIcon', () => {
    return function MockTapGestureIcon({ color, size }: { color: string; size: number }) {
        const { View, Text } = jest.requireActual('react-native');
        return (
            <View testID="tap-gesture-icon">
                <Text>TapIcon - Color: {color}, Size: {size}</Text>
            </View>
        );
    };
});

jest.mock('../Buttons/SwipeGestureIcon', () => {
    return function MockSwipeGestureIcon({ color, size }: { color: string; size: number }) {
        const { View, Text } = jest.requireActual('react-native');
        return (
            <View testID="swipe-gesture-icon">
                <Text>SwipeIcon - Color: {color}, Size: {size}</Text>
            </View>
        );
    };
});

const createMockStore = (initialState: Parameters<typeof configureStore>[0]['preloadedState']) => {
    return configureStore({
        reducer: {
            settings: settingsReducer,
            games: gamesReducer,
            players: playersReducer,
        },
        preloadedState: initialState,
    });
};

describe('InteractionSelector', () => {
    const mockInitialState = {
        settings: {
            currentGameId: 'game-1',
            interactionType: InteractionType.HalfTap,
            showPointParticles: true,
            addendOne: 1,
            addendTwo: 5,
        },
        games: {
            entities: {},
            ids: [],
        },
        players: {
            entities: {},
            ids: [],
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render Point Gesture title', () => {
        const store = createMockStore(mockInitialState);

        const { getByText } = render(
            <Provider store={store}>
                <InteractionSelector />
            </Provider>
        );

        expect(getByText('Point Gesture')).toBeTruthy();
    });

    it('should render both tap and swipe buttons', () => {
        const store = createMockStore(mockInitialState);

        const { getByTestId, getByText } = render(
            <Provider store={store}>
                <InteractionSelector />
            </Provider>
        );

        expect(getByTestId('big-button-tap')).toBeTruthy();
        expect(getByTestId('big-button-swipe')).toBeTruthy();
        expect(getByText('Tap')).toBeTruthy();
        expect(getByText('Swipe')).toBeTruthy();
    });

    it('should render correct icons for both buttons', () => {
        const store = createMockStore(mockInitialState);

        const { getByTestId } = render(
            <Provider store={store}>
                <InteractionSelector />
            </Provider>
        );

        expect(getByTestId('tap-gesture-icon')).toBeTruthy();
        expect(getByTestId('swipe-gesture-icon')).toBeTruthy();
    });

    it('should highlight tap button when HalfTap is selected', () => {
        const store = createMockStore({
            ...mockInitialState,
            settings: {
                ...mockInitialState.settings,
                interactionType: InteractionType.HalfTap,
            },
        });

        const { getByText } = render(
            <Provider store={store}>
                <InteractionSelector />
            </Provider>
        );

        // Tap button should be active (selected) color, swipe should be dimmed
        expect(getByText('TapIcon - Color: #000000, Size: 40')).toBeTruthy();
        expect(getByText('SwipeIcon - Color: #999999, Size: 40')).toBeTruthy();
    });

    it('should highlight swipe button when SwipeVertical is selected', () => {
        const store = createMockStore({
            ...mockInitialState,
            settings: {
                ...mockInitialState.settings,
                interactionType: InteractionType.SwipeVertical,
            },
        });

        const { getByText } = render(
            <Provider store={store}>
                <InteractionSelector />
            </Provider>
        );

        // Swipe button should be active (selected) color, tap should be dimmed
        expect(getByText('SwipeIcon - Color: #000000, Size: 40')).toBeTruthy();
        expect(getByText('TapIcon - Color: #999999, Size: 40')).toBeTruthy();
    });

    it('should display correct description for HalfTap', () => {
        const store = createMockStore({
            ...mockInitialState,
            settings: {
                ...mockInitialState.settings,
                interactionType: InteractionType.HalfTap,
            },
        });

        const { getByText } = render(
            <Provider store={store}>
                <InteractionSelector />
            </Provider>
        );

        expect(getByText('Tap the top or bottom of each player\'s tile.')).toBeTruthy();
    });

    it('should display correct description for SwipeVertical', () => {
        const store = createMockStore({
            ...mockInitialState,
            settings: {
                ...mockInitialState.settings,
                interactionType: InteractionType.SwipeVertical,
            },
        });

        const { getByText } = render(
            <Provider store={store}>
                <InteractionSelector />
            </Provider>
        );

        expect(getByText('Swipe up or down on the player\'s tile.')).toBeTruthy();
    });

    it('should dispatch setInteractionType and log analytics when tap button is pressed', () => {
        const store = createMockStore({
            ...mockInitialState,
            settings: {
                ...mockInitialState.settings,
                interactionType: InteractionType.SwipeVertical, // Start with swipe selected
            },
        });

        const mockLogEvent = jest.mocked(Analytics.logEvent);

        const { getByTestId } = render(
            <Provider store={store}>
                <InteractionSelector />
            </Provider>
        );

        const tapButton = getByTestId('big-button-tap');
        fireEvent.press(tapButton);

        // Check that the store was updated
        const state = store.getState();
        expect(state.settings.interactionType).toBe(InteractionType.HalfTap);

        // Check that analytics event was logged
        expect(mockLogEvent).toHaveBeenCalledWith('interaction_type', {
            interactionType: 'half_tap',
            gameId: 'game-1',
        });
    });

    it('should dispatch setInteractionType and log analytics when swipe button is pressed', () => {
        const store = createMockStore({
            ...mockInitialState,
            settings: {
                ...mockInitialState.settings,
                interactionType: InteractionType.HalfTap, // Start with tap selected
            },
        });

        const mockLogEvent = jest.mocked(Analytics.logEvent);

        const { getByTestId } = render(
            <Provider store={store}>
                <InteractionSelector />
            </Provider>
        );

        const swipeButton = getByTestId('big-button-swipe');
        fireEvent.press(swipeButton);

        // Check that the store was updated
        const state = store.getState();
        expect(state.settings.interactionType).toBe(InteractionType.SwipeVertical);

        // Check that analytics event was logged
        expect(mockLogEvent).toHaveBeenCalledWith('interaction_type', {
            interactionType: 'swipe_vertical',
            gameId: 'game-1',
        });
    });

    it('should handle undefined currentGameId in analytics', () => {
        const store = createMockStore({
            ...mockInitialState,
            settings: {
                ...mockInitialState.settings,
                currentGameId: undefined,
            },
        });

        const mockLogEvent = jest.mocked(Analytics.logEvent);

        const { getByTestId } = render(
            <Provider store={store}>
                <InteractionSelector />
            </Provider>
        );

        const tapButton = getByTestId('big-button-tap');
        fireEvent.press(tapButton);

        // Check that analytics event was logged with undefined gameId
        expect(mockLogEvent).toHaveBeenCalledWith('interaction_type', {
            interactionType: 'half_tap',
            gameId: undefined,
        });
    });

    it('should set animated prop to false for both buttons', () => {
        const store = createMockStore(mockInitialState);

        const { getAllByText } = render(
            <Provider store={store}>
                <InteractionSelector />
            </Provider>
        );

        const animatedTexts = getAllByText('Animated: false');
        expect(animatedTexts).toHaveLength(2); // Both buttons should have animated: false
    });

    it('should pass correct size to icons', () => {
        const store = createMockStore(mockInitialState);

        const { getByText } = render(
            <Provider store={store}>
                <InteractionSelector />
            </Provider>
        );

        expect(getByText('TapIcon - Color: #000000, Size: 40')).toBeTruthy();
        expect(getByText('SwipeIcon - Color: #999999, Size: 40')).toBeTruthy();
    });

    it('should update description when interaction type changes', () => {
        const store = createMockStore({
            ...mockInitialState,
            settings: {
                ...mockInitialState.settings,
                interactionType: InteractionType.HalfTap,
            },
        });

        const { getByText, getByTestId, rerender } = render(
            <Provider store={store}>
                <InteractionSelector />
            </Provider>
        );

        // Initially should show tap description
        expect(getByText('Tap the top or bottom of each player\'s tile.')).toBeTruthy();

        // Change to swipe
        const swipeButton = getByTestId('big-button-swipe');
        fireEvent.press(swipeButton);

        // Re-render to see the updated description
        rerender(
            <Provider store={store}>
                <InteractionSelector />
            </Provider>
        );

        // Should now show swipe description
        expect(getByText('Swipe up or down on the player\'s tile.')).toBeTruthy();
    });

    it('should handle rapid button presses correctly', () => {
        const store = createMockStore(mockInitialState);
        const mockLogEvent = jest.mocked(Analytics.logEvent);

        const { getByTestId } = render(
            <Provider store={store}>
                <InteractionSelector />
            </Provider>
        );

        const tapButton = getByTestId('big-button-tap');
        const swipeButton = getByTestId('big-button-swipe');

        // Rapidly press both buttons
        fireEvent.press(tapButton);
        fireEvent.press(swipeButton);
        fireEvent.press(tapButton);

        // Should have logged 3 events
        expect(mockLogEvent).toHaveBeenCalledTimes(3);
        
        // Final state should be HalfTap
        const state = store.getState();
        expect(state.settings.interactionType).toBe(InteractionType.HalfTap);
    });
});
