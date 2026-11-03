import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

import { InteractionType } from '../src/components/Interactions/InteractionType';
import { SortDirectionKey, SortSelectorKey } from '../src/components/ScoreLog/SortHelper';

import { exportBackup, importBackup, parseBackupData } from './backup';
import { initialState as initialSettings } from './SettingsSlice';

const mockDispatch = jest.fn();
const mockGetState = jest.fn();
const mockFileCreate = jest.fn();
const mockFileText = jest.fn(() => Promise.resolve(mockFileContent));
const mockFileWrite = jest.fn();
let mockFileContent = '';

jest.mock('./store', () => ({
    store: {
        dispatch: (...args: unknown[]) => mockDispatch(...args),
        getState: (...args: unknown[]) => mockGetState(...args),
    },
}));

jest.mock('expo-document-picker', () => ({
    getDocumentAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
    Paths: { cache: '/cache' },
    File: jest.fn().mockImplementation(() => ({
        create: (...args: unknown[]) => mockFileCreate(...args),
        text: () => mockFileText(),
        uri: 'file:///backup.json',
        write: (...args: unknown[]) => mockFileWrite(...args),
    })),
}));

jest.mock('expo-sharing', () => ({
    isAvailableAsync: jest.fn(),
    shareAsync: jest.fn(),
}));

const createValidBackup = () => ({
    version: 1,
    exportedAt: 1_750_000_000_000,
    games: {
        ids: ['game-1'],
        entities: {
            'game-1': {
                id: 'game-1',
                title: 'Test Game',
                dateCreated: 1_750_000_000_000,
                roundCurrent: 0,
                roundTotal: 1,
                playerIds: ['player-1'],
                interactionType: InteractionType.SwipeVertical,
            },
        },
    },
    players: {
        ids: ['player-1'],
        entities: {
            'player-1': {
                id: 'player-1',
                playerName: 'Player 1',
                scores: [0],
            },
        },
    },
    settings: {
        ...initialSettings,
        currentGameId: 'game-1',
        _persist: {
            rehydrated: true,
            version: 4,
        },
    },
});

const createRichState = () => ({
    games: {
        ids: ['game-1'],
        entities: {
            'game-1': {
                id: 'game-1',
                title: 'League Final',
                dateCreated: 1_750_000_000_000,
                roundCurrent: 2,
                roundTotal: 3,
                playerIds: ['player-1', 'player-2'],
                locked: true,
                winnerIds: ['player-2'],
                sortSelectorKey: SortSelectorKey.ByIndex,
                sortDirectionKey: SortDirectionKey.Reversed,
                palette: 'pastel',
                interactionType: InteractionType.Dial,
                scoring: { winner: 'low' as const, end: { type: 'rounds' as const, rounds: 3 } },
            },
        },
    },
    players: {
        ids: ['player-1', 'player-2'],
        entities: {
            'player-1': {
                id: 'player-1',
                playerName: 'Alex',
                scores: [12, -2, 6],
                color: '#112233',
            },
            'player-2': {
                id: 'player-2',
                playerName: 'Blair',
                scores: [4, 3, 1],
                color: '#abcdef',
            },
        },
    },
    settings: {
        ...initialSettings,
        currentGameId: 'game-1',
        interactionType: InteractionType.HalfTap,
        lastUsedInteractionType: InteractionType.Dial,
        gameModesEnabled: true,
        colorScheme: 'dark' as const,
        _persist: { rehydrated: true, version: 5 },
    },
});

describe('backup validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockFileContent = '';
        mockGetState.mockReturnValue(createRichState());
        mockFileText.mockImplementation(() => Promise.resolve(mockFileContent));
        (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({ canceled: true });
        (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
        jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    });

    it('round-trips games, players, and settings through export and import', async () => {
        const source = createRichState();
        mockGetState.mockReturnValue(source);

        await exportBackup();

        expect(mockFileCreate).toHaveBeenCalledWith({ overwrite: true });
        expect(mockFileWrite).toHaveBeenCalledTimes(1);
        expect(Sharing.shareAsync).toHaveBeenCalledWith(
            'file:///backup.json',
            {
                dialogTitle: 'Save ScorePad Backup',
                mimeType: 'application/json',
            }
        );

        mockFileContent = mockFileWrite.mock.calls[0][0] as string;
        const parsed = parseBackupData(JSON.parse(mockFileContent));
        expect(parsed?.games.entities).toEqual(source.games.entities);
        expect(parsed?.players.entities).toEqual(source.players.entities);
        expect(parsed?.settings).toMatchObject({
            colorScheme: 'dark',
            currentGameId: 'game-1',
            gameModesEnabled: true,
            interactionType: InteractionType.HalfTap,
            lastUsedInteractionType: InteractionType.Dial,
        });
        expect(parsed?.settings).not.toHaveProperty('_persist');

        (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
            canceled: false,
            assets: [{ uri: 'file:///backup.json' }],
        });
        await importBackup();

        expect(mockDispatch.mock.calls.map(([action]) => action)).toEqual([
            { type: 'games/restoreAllGames', payload: source.games.entities },
            { type: 'players/restoreAllPlayers', payload: source.players.entities },
            { type: 'settings/restoreSettings', payload: parsed?.settings },
        ]);
        expect(Alert.alert).toHaveBeenCalledWith(
            'Restore Complete',
            'Your data has been restored from the backup.'
        );
    });

    it('reports when export sharing is unavailable', async () => {
        (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

        await exportBackup();

        expect(Sharing.shareAsync).not.toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalledWith(
            'Export Unavailable',
            'Sharing is not available on this device.'
        );
    });

    it('reports export failures', async () => {
        mockFileWrite.mockImplementationOnce(() => {
            throw new Error('disk full');
        });

        await exportBackup();

        expect(Alert.alert).toHaveBeenCalledWith(
            'Export Failed',
            'An error occurred while exporting the backup.'
        );
        expect(Sharing.shareAsync).not.toHaveBeenCalled();
    });

    it('does nothing when import is canceled', async () => {
        await importBackup();

        expect(mockFileText).not.toHaveBeenCalled();
        expect(mockDispatch).not.toHaveBeenCalled();
        expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('reports malformed JSON without dispatching restore actions', async () => {
        mockFileContent = '{not json';
        (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
            canceled: false,
            assets: [{ uri: 'file:///backup.json' }],
        });

        await importBackup();

        expect(mockDispatch).not.toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalledWith(
            'Import Failed',
            'The selected file is not a valid JSON file.'
        );
    });

    it('reports file read failures without dispatching restore actions', async () => {
        mockFileText.mockRejectedValueOnce(new Error('permission denied'));
        (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
            canceled: false,
            assets: [{ uri: 'file:///backup.json' }],
        });

        await importBackup();

        expect(mockDispatch).not.toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalledWith(
            'Import Failed',
            'An error occurred while importing the backup.'
        );
    });

    it('accepts a complete backup and strips Redux Persist metadata', () => {
        const parsed = parseBackupData(createValidBackup());

        expect(parsed).toBeDefined();
        expect(parsed?.settings.currentGameId).toBe('game-1');
        expect(parsed?.settings).not.toHaveProperty('_persist');
    });

    it('keeps a game\'s scoring rules and the game modes flag', () => {
        const backup = createValidBackup();
        (backup.games.entities['game-1'] as Record<string, unknown>).scoring = { winner: 'low' };
        backup.settings.gameModesEnabled = true;

        const parsed = parseBackupData(backup);

        expect(parsed?.games.entities['game-1'].scoring).toEqual({ winner: 'low' });
        expect(parsed?.settings.gameModesEnabled).toBe(true);
    });

    it('keeps a game\'s end condition', () => {
        const backup = createValidBackup();
        const scoring = { winner: 'low', end: { type: 'target', target: 100 } };
        (backup.games.entities['game-1'] as Record<string, unknown>).scoring = scoring;

        expect(parseBackupData(backup)?.games.entities['game-1'].scoring).toEqual(scoring);
    });

    it.each([
        ['unsupported version', (backup: ReturnType<typeof createValidBackup>) => {
            backup.version = 99;
        }],
        ['missing settings', (backup: ReturnType<typeof createValidBackup>) => {
            delete (backup as Partial<typeof backup>).settings;
        }],
        ['mismatched entity ids', (backup: ReturnType<typeof createValidBackup>) => {
            backup.games.ids = ['missing-game'];
        }],
        ['dangling player reference', (backup: ReturnType<typeof createValidBackup>) => {
            backup.games.entities['game-1'].playerIds = ['missing-player'];
        }],
        ['invalid score', (backup: ReturnType<typeof createValidBackup>) => {
            backup.players.entities['player-1'].scores = [Number.NaN];
        }],
        ['missing current game', (backup: ReturnType<typeof createValidBackup>) => {
            backup.settings.currentGameId = 'missing-game';
        }],
        ['invalid scoring rules', (backup: ReturnType<typeof createValidBackup>) => {
            (backup.games.entities['game-1'] as Record<string, unknown>).scoring = { winner: 'middle' };
        }],
        ['invalid end condition', (backup: ReturnType<typeof createValidBackup>) => {
            (backup.games.entities['game-1'] as Record<string, unknown>).scoring = {
                winner: 'high',
                end: { type: 'rounds', rounds: -1 },
            };
        }],
        ['non-boolean game modes flag', (backup: ReturnType<typeof createValidBackup>) => {
            (backup.settings as Record<string, unknown>).gameModesEnabled = 'yes';
        }],
    ])('rejects %s', (_description, mutate) => {
        const backup = createValidBackup();
        mutate(backup);

        expect(parseBackupData(backup)).toBeUndefined();
    });

    it('does not dispatch any restore actions for invalid backup data', async () => {
        mockFileContent = JSON.stringify({
            games: { entities: {} },
            players: { entities: {} },
        });
        (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
            canceled: false,
            assets: [{ uri: 'file:///backup.json' }],
        });

        await importBackup();

        expect(mockDispatch).not.toHaveBeenCalled();
        expect(Alert.alert).toHaveBeenCalledWith(
            'Import Failed',
            'The selected file is not a valid ScorePad backup.'
        );
    });

    it('dispatches all restore actions only after a backup passes validation', async () => {
        mockFileContent = JSON.stringify(createValidBackup());
        expect(parseBackupData(JSON.parse(mockFileContent))).toBeDefined();
        (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
            canceled: false,
            assets: [{ uri: 'file:///backup.json' }],
        });

        await importBackup();

        expect(Alert.alert).toHaveBeenCalledWith(
            'Restore Complete',
            'Your data has been restored from the backup.'
        );
        expect(mockDispatch).toHaveBeenCalledTimes(3);
    });
});
