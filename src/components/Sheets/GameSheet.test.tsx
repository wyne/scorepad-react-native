import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { Provider } from 'react-redux';

import gamesReducer from '../../../redux/GamesSlice';
import playersReducer from '../../../redux/PlayersSlice';
import settingsReducer from '../../../redux/SettingsSlice';
import { logEvent } from '../../Analytics';

import GameSheet from './GameSheet';

// Mock Analytics
jest.mock('../../Analytics', () => ({
    logEvent: jest.fn(),
}));

// Mock @gorhom/bottom-sheet
jest.mock('@gorhom/bottom-sheet', () => {
    const { forwardRef, useImperativeHandle } = jest.requireActual('react');
    const { View, ScrollView } = jest.requireActual('react-native');
    
    const MockBottomSheet = forwardRef((props: {
        children: React.ReactNode;
        onChange?: (index: number) => void;
        snapPoints: (string | number)[];
        index: number;
        backdropComponent?: React.ComponentType;
        backgroundStyle?: object;
        handleComponent?: React.ComponentType;
        handleIndicatorStyle?: object;
        animatedPosition?: object;
        enablePanDownToClose?: boolean;
        topInset?: number;
    }, ref: React.Ref<{ snapToIndex: (index: number) => void }>) => {
        useImperativeHandle(ref, () => ({
            snapToIndex: jest.fn((index: number) => {
                props.onChange?.(index);
            }),
        }));
        
        return (
            <View testID="bottom-sheet" style={{ backgroundColor: 'rgb(30,40,50)' }} topInset={props.topInset} initialIndex={props.index}>
                {props.handleComponent ? <props.handleComponent /> : null}
                {props.children}
            </View>
        );
    });
    
    const MockBottomSheetScrollView = ({ children }: { children: React.ReactNode }) => (
        <ScrollView testID="bottom-sheet-scroll">{children}</ScrollView>
    );
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const MockBottomSheetBackdrop = (props: {
        disappearsOnIndex: number;
        appearsOnIndex: number;
        pressBehavior: number;
    }) => (
        <View testID="bottom-sheet-backdrop" />
    );
    
    return {
        __esModule: true,
        default: MockBottomSheet,
        BottomSheetHandle: () => <View testID="bottom-sheet-default-handle" />,
        BottomSheetScrollView: MockBottomSheetScrollView,
        BottomSheetBackdrop: MockBottomSheetBackdrop,
    };
});

// Mock react-navigation
jest.mock('@react-navigation/native', () => ({
    useIsFocused: jest.fn(() => true),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
    const View = jest.requireActual('react-native').View;
    const Text = jest.requireActual('react-native').Text;
    
    return {
        __esModule: true,
        default: {
            View: View,
            Text: Text,
        },
        useSharedValue: jest.fn((value) => ({ value })),
        useAnimatedStyle: jest.fn((callback) => callback()),
        useAnimatedReaction: jest.fn(),
        useDerivedValue: jest.fn((callback) => ({ value: callback() })),
        runOnJS: jest.fn((fn) => fn),
        withTiming: jest.fn((value) => value),
        FadeIn: {
            delay: jest.fn(() => ({ delay: jest.fn() })),
        },
        interpolate: jest.fn(),
        Extrapolate: {
            CLAMP: 'clamp',
        },
    };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: ({ children }: { children: React.ReactNode }) => {
        const { View } = jest.requireActual('react-native');
        return <View testID="safe-area-view">{children}</View>;
    },
}));

// Mock @rneui/base
jest.mock('@rneui/base', () => ({
    Button: ({ title, onPress, testID }: {
        title: string;
        onPress: () => void;
        testID?: string;
    }) => {
        const { TouchableOpacity, Text } = jest.requireActual('react-native');
        return (
            <TouchableOpacity onPress={onPress} testID={testID}>
                <Text>{title}</Text>
            </TouchableOpacity>
        );
    },
}));

// Mock components
jest.mock('../BigButtons/BigButton', () => {
    return function MockBigButton({ text, onPress, testID }: {
        text: string;
        onPress: () => void;
        testID?: string;
    }) {
        const { TouchableOpacity, Text } = jest.requireActual('react-native');
        return (
            <TouchableOpacity onPress={onPress} testID={testID || `big-button-${text.toLowerCase()}`}>
                <Text>{text}</Text>
            </TouchableOpacity>
        );
    };
});

jest.mock('../Icons/RematchIcon', () => {
    return function MockRematchIcon() {
        const { View, Text } = jest.requireActual('react-native');
        return <View testID="rematch-icon"><Text>Rematch Icon</Text></View>;
    };
});

jest.mock('../ScoreLogTable', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function MockScoreLogTable({ navigation }: {
        navigation: object;
    }) {
        const { View, Text } = jest.requireActual('react-native');
        return (
            <View testID="score-log-table">
                <Text>ScoreLogTable</Text>
            </View>
        );
    };
});

// Mock @react-navigation/native
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
    const actual = jest.requireActual('@react-navigation/native');
    return {
        ...actual,
        useNavigation: jest.fn(() => ({
            navigate: mockNavigate,
        })),
        useNavigationState: jest.fn((selector) => {
            const state = { routes: [{ name: 'Game' }], index: 0 };
            return selector(state);
        }),
    };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: ({ children }: { children: React.ReactNode }) => {
        const { View } = jest.requireActual('react-native');
        return <View>{children}</View>;
    },
    useSafeAreaInsets: jest.fn(() => ({ top: 50, bottom: 34, left: 0, right: 0 })),
}));

// Mock GameSheetContext
const mockPendingIndex: { current: number | null } = { current: null };
jest.mock('./GameSheetContext', () => ({
    useGameSheetContext: jest.fn(() => ({
        current: {
            snapToIndex: jest.fn(),
        },
    })),
    useGameSheetPendingIndex: () => mockPendingIndex,
}));

// Mock Alert
jest.spyOn(Alert, 'alert');


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

describe('GameSheet', () => {
    const mockGame = {
        id: 'game-1',
        title: 'Test Game',
        dateCreated: Date.now(),
        roundCurrent: 1,
        roundTotal: 3,
        playerIds: ['player-1', 'player-2'],
        locked: false,
    };

    const mockPlayers = {
        'player-1': {
            id: 'player-1',
            playerName: 'Player 1',
            scores: [10, 15],
        },
        'player-2': {
            id: 'player-2',
            playerName: 'Player 2',
            scores: [5, 20],
        },
    };

    const defaultProps = {};

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render null when no current game is set', () => {
        const store = createMockStore({
            settings: {
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
        });

        const { toJSON } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        expect(toJSON()).toBeNull();
    });

    it('should render game sheet when current game is set', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': mockGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId, getByText } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        expect(getByTestId('bottom-sheet')).toBeTruthy();
        expect(getByText('Test Game')).toBeTruthy();
        expect(getByTestId('score-log-table')).toBeTruthy();
    });

    it('renders a tappable sheet handle', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': mockGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        expect(getByTestId('game-sheet-handle')).toBeTruthy();
    });

    it('should allow full expansion up to the top safe area', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': mockGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        expect(getByTestId('bottom-sheet').props.topInset).toBe(50);
    });

    it('leaves the locked state to the header pill when game is locked', () => {
        const lockedGame = { ...mockGame, locked: true };
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': lockedGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByText, queryByText } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        expect(queryByText('Locked')).toBeNull();
        expect(getByText('Unlock')).toBeTruthy();
    });

    it('should show unlock button when game is locked', () => {
        const lockedGame = { ...mockGame, locked: true };
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': lockedGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        expect(getByTestId('unlock-button')).toBeTruthy();
    });

    it('opens to a point asked for while it was hidden', () => {
        mockPendingIndex.current = 2;
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': { ...mockGame, locked: true },
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        expect(getByTestId('bottom-sheet').props.initialIndex).toBe(2);
        expect(mockPendingIndex.current).toBeNull();
    });

    it('should show choose winners button when game is unlocked', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': mockGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        expect(getByTestId('choose-winners-button')).toBeTruthy();
    });

    it('should navigate to Share when share button is pressed', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': mockGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        fireEvent.press(getByTestId('share-button'));

        expect(mockNavigate).toHaveBeenCalledWith('Share');
    });

    it('should toggle lock when unlock button is pressed', async () => {
        const lockedGame = { ...mockGame, locked: true };
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': lockedGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        const unlockButton = getByTestId('unlock-button');
        fireEvent.press(unlockButton);

        await waitFor(() => {
            expect(logEvent).toHaveBeenCalledWith('lock_game', {
                game_id: 'game-1',
                locked: false,
            });
        });
    });

    it('should show reset button when game is not locked', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': mockGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        expect(getByTestId('big-button-reset')).toBeTruthy();
    });

    it('should not show reset button when game is locked', () => {
        const lockedGame = { ...mockGame, locked: true };
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': lockedGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { queryByTestId } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        expect(queryByTestId('big-button-reset')).toBeNull();
    });

    it('should show rematch button', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': mockGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        expect(getByTestId('big-button-rematch')).toBeTruthy();
    });

    it('should show alert when reset button is pressed', async () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': mockGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        const resetButton = getByTestId('big-button-reset');
        fireEvent.press(resetButton);

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Reset Game',
                'Warning: This will reset all scores and rounds for this game. Are you sure you want to reset?',
                expect.arrayContaining([
                    expect.objectContaining({ text: 'Cancel' }),
                    expect.objectContaining({ text: 'Reset' }),
                ])
            );
        });
    });

    it('should show alert when rematch button is pressed', async () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': mockGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        const rematchButton = getByTestId('big-button-rematch');
        fireEvent.press(rematchButton);

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
                'Rematch',
                'This will create a new game with the same players and empty scores.',
                expect.arrayContaining([
                    expect.objectContaining({ text: 'Cancel' }),
                    expect.objectContaining({ text: 'Rematch' }),
                ])
            );
        });
    });

    it('should navigate to EditGame when edit game button is pressed', async () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': mockGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByText } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        const editButton = getByText('Edit Game and Players');
        fireEvent.press(editButton);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('EditGame', { source: 'edit_game' });
            expect(logEvent).toHaveBeenCalledWith('edit_game', {
                game_id: 'game-1',
            });
        });
    });

    it('should not show edit game button when game is locked', () => {
        const lockedGame = { ...mockGame, locked: true };
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': lockedGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { queryByText } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        expect(queryByText('Edit Game and Players')).toBeNull();
    });

    it('should clear winnerIds when unlocking', async () => {
        const lockedGame = { ...mockGame, locked: true, winnerIds: ['player-1'] };
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': lockedGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        const unlockButton = getByTestId('unlock-button');
        fireEvent.press(unlockButton);

        // Wait for Redux dispatch to be reflected
        await waitFor(() => {
            const state = store.getState();
            const game = state.games.entities['game-1'];
            expect(game?.locked).toBe(false);
            expect(game?.winnerIds).toEqual([]);
        });
    });

    it('should show sorting instruction text', () => {
        const store = createMockStore({
            settings: {
                currentGameId: 'game-1',
            },
            games: {
                entities: {
                    'game-1': mockGame,
                },
                ids: ['game-1'],
            },
            players: {
                entities: mockPlayers,
                ids: ['player-1', 'player-2'],
            },
        });

        const { getByText } = render(
            <Provider store={store}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        expect(getByText('Tap the player column or total score column to change sorting.')).toBeTruthy();
    });

    describe('scoring rule label', () => {
        const renderWith = (gameModesEnabled: boolean, game: Record<string, unknown> = {}) => render(
            <Provider store={createMockStore({
                settings: { currentGameId: 'game-1', gameModesEnabled },
                games: { entities: { 'game-1': { ...mockGame, ...game } }, ids: ['game-1'] },
                players: { entities: mockPlayers, ids: ['player-1', 'player-2'] },
            })}>
                <GameSheet {...defaultProps} />
            </Provider>
        );

        it('is hidden while the game modes flag is off', () => {
            const { queryByTestId } = renderWith(false);
            expect(queryByTestId('game-sheet-scoring-rule')).toBeNull();
        });

        it('shows the rule and opens the rules screen while the flag is on', () => {
            const { getByTestId, getByText } = renderWith(true, { scoring: { winner: 'low' } });

            expect(getByText('Lowest wins')).toBeTruthy();
            fireEvent.press(getByTestId('game-sheet-scoring-rule'));
            expect(mockNavigate).toHaveBeenCalledWith('ScoringRules');
        });

        it('shows free play for a game without rules', () => {
            const { getByText } = renderWith(true);
            expect(getByText('Free play')).toBeTruthy();
        });

        it('stays for a game with rules after the flag is turned off', () => {
            const { getByText } = renderWith(false, { scoring: { winner: 'high' } });
            expect(getByText('Highest wins')).toBeTruthy();
        });
    });
});
