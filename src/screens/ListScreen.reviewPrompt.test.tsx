import React from 'react';

import type { ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { configureStore } from '@reduxjs/toolkit';
import { render, waitFor } from '@testing-library/react-native';
import * as StoreReview from 'expo-store-review';
import { Provider } from 'react-redux';

import gamesReducer from '../../redux/GamesSlice';
import playersReducer from '../../redux/PlayersSlice';
import settingsReducer from '../../redux/SettingsSlice';
import { logEvent } from '../Analytics';
import { InteractionType } from '../components/Interactions/InteractionType';

import ListScreen from './ListScreen';

/**
 * End-to-end cover for the review prompt: real ListScreen, real
 * useStoreReviewPrompt, real reducers and selectors. Only the native module and
 * the analytics transport are stubbed.
 *
 * ListScreen.test.tsx mocks the hook and useStoreReviewPrompt.test.tsx mocks the
 * store, so between them the wiring itself -- the screen actually mounting, the
 * hook actually reading the store -- was never exercised. That seam is where
 * this feature has broken twice: the v3.0.0 refactor deleted the component the
 * prompt hung off, and the v3.0.4 fix reattached it to BackButton, which was
 * itself no longer rendered. Both times the logic was fine and the wiring was
 * not, and both times the tests stayed green.
 */

jest.mock('@react-navigation/elements', () => ({
    useHeaderHeight: () => 0,
}));

// Focus effects run outside a NavigationContainer here. The first invocation
// stands in for the app opening on the list; refocus() is the return from a game.
const focusCallbacks: (() => void)[] = [];
jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useFocusEffect: (callback: () => void) => {
        const { useEffect } = jest.requireActual('react');
        focusCallbacks.push(callback);
        useEffect(() => callback(), [callback]);
    },
}));

// Deliberately NOT mocking ../hooks/useStoreReviewPrompt -- that is the code
// under test.
jest.mock('expo-store-review', () => ({
    isAvailableAsync: jest.fn(),
    requestReview: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
    randomUUID: jest.fn(() => 'mock-uuid-123'),
}));

jest.mock('react-native-reanimated', () => {
    const View = jest.requireActual('react-native').View;
    const FlatList = jest.requireActual('react-native').FlatList;

    return {
        __esModule: true,
        default: { View, FlatList },
        LinearTransition: { easing: jest.fn(() => ({})) },
        Easing: { ease: jest.fn() },
    };
});

jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style: object }) => {
        const { View } = jest.requireActual('react-native');
        return <View style={style} testID="safe-area-view">{children}</View>;
    },
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('../Analytics', () => ({
    logEvent: jest.fn(),
}));

jest.mock('../Logger', () => ({
    __esModule: true,
    default: { info: jest.fn(), error: jest.fn() },
    info: jest.fn(),
    error: jest.fn(),
}));

jest.mock('../components/GameListItem', () => {
    return function MockGameListItem({ gameId }: { gameId: string }) {
        const { View, Text } = jest.requireActual('react-native');
        return <View testID={`game-list-item-${gameId}`}><Text>{gameId}</Text></View>;
    };
});

const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    setOptions: jest.fn(),
    addListener: jest.fn(() => jest.fn()),
    isFocused: jest.fn(() => true),
} as unknown as NativeStackNavigationProp<ParamListBase, string, undefined>;

const makeGame = (id: string, roundCurrent: number) => ({
    id,
    title: `Game ${id}`,
    dateCreated: 1_700_000_000_000,
    roundCurrent,
    roundTotal: roundCurrent + 1,
    playerIds: [],
});

/**
 * A user who has cleared every eligibility gate: three games (the minimum),
 * a current game they have actually played past the first round, and no prior
 * prompt on record.
 */
const eligibleState = (overrides: { hasScored?: boolean; lastStoreReviewPrompt?: number } = {}) => {
    const { hasScored = true, lastStoreReviewPrompt = 0 } = overrides;
    return {
        settings: {
            appOpens: 5,
            devMenuEnabled: false,
            installId: 'existing-id',
            rollingGameCounter: 3,
            currentGameId: 'g1',
            lastStoreReviewPrompt,
            lastUsedInteractionType: hasScored ? InteractionType.SwipeVertical : undefined,
        },
        games: {
            entities: {
                // All single-round: the previous gate would have blocked these.
                g1: makeGame('g1', 0),
                g2: makeGame('g2', 0),
                g3: makeGame('g3', 0),
            },
            ids: ['g1', 'g2', 'g3'],
        },
        players: { entities: {}, ids: [] },
    };
};

const renderList = (preloadedState: ReturnType<typeof eligibleState>) => {
    const store = configureStore({
        reducer: { settings: settingsReducer, games: gamesReducer, players: playersReducer },
        preloadedState: preloadedState as Parameters<typeof configureStore>[0]['preloadedState'],
    });
    const utils = render(
        <Provider store={store}>
            <ListScreen navigation={mockNavigation} />
        </Provider>
    );
    return { store, ...utils };
};

/** The second focus: the user coming back to the list after a game. */
const refocus = () => focusCallbacks[focusCallbacks.length - 1]();

describe('ListScreen review prompt (integration)', () => {
    beforeEach(() => {
        focusCallbacks.length = 0;
        jest.clearAllMocks();
        (StoreReview.isAvailableAsync as jest.Mock).mockResolvedValue(true);
        (StoreReview.requestReview as jest.Mock).mockResolvedValue(undefined);
    });

    it('requests a native review and logs review_prompt on return from a game', async () => {
        renderList(eligibleState());

        refocus();

        await waitFor(() => expect(StoreReview.requestReview).toHaveBeenCalledTimes(1));
        expect(logEvent).toHaveBeenCalledWith('review_prompt', {
            game_count: 3,
            days_since_last: undefined,
        });
    });

    it('records the prompt timestamp so the interval starts counting', async () => {
        const { store } = renderList(eligibleState());

        refocus();

        await waitFor(() => expect(StoreReview.requestReview).toHaveBeenCalled());
        expect(store.getState().settings.lastStoreReviewPrompt).toBeGreaterThan(0);
    });

    it('does not prompt on the first focus, when the app is merely opening', async () => {
        renderList(eligibleState());

        // No refocus() -- only the mount-time focus has happened.
        await waitFor(() => expect(logEvent).toHaveBeenCalled());
        expect(StoreReview.requestReview).not.toHaveBeenCalled();
        expect(logEvent).not.toHaveBeenCalledWith('review_prompt', expect.anything());
    });

    it('logs review_prompt_skipped when the store front is unavailable', async () => {
        (StoreReview.isAvailableAsync as jest.Mock).mockResolvedValue(false);
        renderList(eligibleState());

        refocus();

        await waitFor(() => expect(logEvent).toHaveBeenCalledWith(
            'review_prompt_skipped',
            { reason: 'unavailable', game_count: 3 },
        ));
        expect(StoreReview.requestReview).not.toHaveBeenCalled();
    });

    it('stays silent for a user who has made games but never scored', async () => {
        renderList(eligibleState({ hasScored: false }));

        refocus();

        await waitFor(() => expect(logEvent).toHaveBeenCalled());
        expect(StoreReview.requestReview).not.toHaveBeenCalled();
        expect(logEvent).not.toHaveBeenCalledWith('review_prompt', expect.anything());
    });

    it('stays silent for a user prompted within the last 90 days', async () => {
        renderList(eligibleState({ lastStoreReviewPrompt: Date.now() - 10 * 24 * 60 * 60 * 1000 }));

        refocus();

        await waitFor(() => expect(logEvent).toHaveBeenCalled());
        expect(StoreReview.requestReview).not.toHaveBeenCalled();
    });
});
