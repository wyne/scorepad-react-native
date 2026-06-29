import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';

import { InteractionType } from '../src/components/Interactions/InteractionType';

import { importBackup, parseBackupData } from './backup';
import { initialState as initialSettings } from './SettingsSlice';

const mockDispatch = jest.fn();
let mockFileContent = '';

jest.mock('./store', () => ({
    store: {
        dispatch: (...args: unknown[]) => mockDispatch(...args),
        getState: jest.fn(),
    },
}));

jest.mock('expo-document-picker', () => ({
    getDocumentAsync: jest.fn(),
}));

jest.mock('expo-file-system', () => ({
    Paths: { cache: '/cache' },
    File: jest.fn().mockImplementation(() => ({
        create: jest.fn(),
        text: jest.fn(() => Promise.resolve(mockFileContent)),
        uri: 'file:///backup.json',
        write: jest.fn(),
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

describe('backup validation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
    });

    it('accepts a complete backup and strips Redux Persist metadata', () => {
        const parsed = parseBackupData(createValidBackup());

        expect(parsed).toBeDefined();
        expect(parsed?.settings.currentGameId).toBe('game-1');
        expect(parsed?.settings).not.toHaveProperty('_persist');
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
