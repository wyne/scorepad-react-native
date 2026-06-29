import * as DocumentPicker from 'expo-document-picker';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

import { InteractionType } from '../src/components/Interactions/InteractionType';
import { SortDirectionKey, SortSelectorKey } from '../src/components/ScoreLog/SortHelper';

import { GameState, restoreAllGames } from './GamesSlice';
import { ScoreState, restoreAllPlayers } from './PlayersSlice';
import { initialState as initialSettings, restoreSettings, SettingsState } from './SettingsSlice';
import { store } from './store';

const BACKUP_VERSION = 1;

interface BackupData {
    version: number;
    exportedAt: number;
    games: {
        entities: Record<string, GameState>;
        ids: string[];
    };
    players: {
        entities: Record<string, ScoreState>;
        ids: string[];
    };
    settings: SettingsState;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
);

const isFiniteNumber = (value: unknown): value is number => (
    typeof value === 'number' && Number.isFinite(value)
);

const isStringArray = (value: unknown): value is string[] => (
    Array.isArray(value) && value.every(item => typeof item === 'string')
);

const hasMatchingIds = (ids: string[], entities: Record<string, unknown>): boolean => {
    const entityIds = Object.keys(entities);
    return ids.length === entityIds.length
        && new Set(ids).size === ids.length
        && ids.every(id => Object.hasOwn(entities, id));
};

const isInteractionType = (value: unknown): value is InteractionType => (
    typeof value === 'string' && Object.values(InteractionType).includes(value as InteractionType)
);

const isGameState = (
    value: unknown,
    id: string,
    playerEntities: Record<string, unknown>
): value is GameState => {
    if (!isRecord(value)) return false;
    if (value.id !== id || typeof value.title !== 'string') return false;
    if (!isFiniteNumber(value.dateCreated)) return false;
    if (!Number.isInteger(value.roundCurrent) || (value.roundCurrent as number) < 0) return false;
    if (!Number.isInteger(value.roundTotal) || (value.roundTotal as number) < 1) return false;
    if ((value.roundCurrent as number) >= (value.roundTotal as number)) return false;
    const playerIds = value.playerIds;
    if (!isStringArray(playerIds) || new Set(playerIds).size !== playerIds.length) return false;
    if (!playerIds.every(playerId => Object.hasOwn(playerEntities, playerId))) return false;

    if (value.locked !== undefined && typeof value.locked !== 'boolean') return false;
    if (value.winnerIds !== undefined) {
        if (!isStringArray(value.winnerIds)) return false;
        if (!value.winnerIds.every(winnerId => playerIds.includes(winnerId))) return false;
    }
    if (
        value.sortSelectorKey !== undefined
        && !Object.values(SortSelectorKey).includes(value.sortSelectorKey as SortSelectorKey)
    ) return false;
    if (
        value.sortDirectionKey !== undefined
        && !Object.values(SortDirectionKey).includes(value.sortDirectionKey as SortDirectionKey)
    ) return false;
    if (value.palette !== undefined && typeof value.palette !== 'string') return false;
    if (value.interactionType !== undefined && !isInteractionType(value.interactionType)) return false;

    return true;
};

const isScoreState = (value: unknown, id: string): value is ScoreState => {
    if (!isRecord(value)) return false;
    return value.id === id
        && typeof value.playerName === 'string'
        && Array.isArray(value.scores)
        && value.scores.every(isFiniteNumber)
        && (value.color === undefined || typeof value.color === 'string');
};

const isSettingsState = (value: unknown, gameEntities: Record<string, unknown>): value is SettingsState => {
    if (!isRecord(value)) return false;

    const currentGameIdIsValid = value.currentGameId === undefined
        || (
            typeof value.currentGameId === 'string'
            && Object.hasOwn(gameEntities, value.currentGameId)
        );

    return typeof value.home_fullscreen === 'boolean'
        && isFiniteNumber(value.multiplier)
        && isFiniteNumber(value.addendOne)
        && isFiniteNumber(value.addendTwo)
        && currentGameIdIsValid
        && typeof value.showPointParticles === 'boolean'
        && typeof value.showPlayerIndex === 'boolean'
        && isInteractionType(value.interactionType)
        && (value.lastUsedInteractionType === undefined || isInteractionType(value.lastUsedInteractionType))
        && isFiniteNumber(value.lastStoreReviewPrompt)
        && (value.devMenuEnabled === undefined || typeof value.devMenuEnabled === 'boolean')
        && Number.isInteger(value.appOpens)
        && (value.installId === undefined || typeof value.installId === 'string')
        && (value.rollingGameCounter === undefined || Number.isInteger(value.rollingGameCounter))
        && typeof value.keepScreenAwake === 'boolean'
        && isStringArray(value.seenFeatureNotifications)
        && ['system', 'light', 'dark'].includes(value.colorScheme as string);
};

export const parseBackupData = (value: unknown): BackupData | undefined => {
    if (!isRecord(value) || value.version !== BACKUP_VERSION || !isFiniteNumber(value.exportedAt)) {
        return undefined;
    }
    if (!isRecord(value.games) || !isRecord(value.players)) return undefined;
    if (!isRecord(value.games.entities) || !isStringArray(value.games.ids)) return undefined;
    if (!isRecord(value.players.entities) || !isStringArray(value.players.ids)) return undefined;

    const gameEntities = value.games.entities;
    const gameIds = value.games.ids;
    const playerEntities = value.players.entities;
    const playerIds = value.players.ids;

    if (!hasMatchingIds(gameIds, gameEntities)) return undefined;
    if (!hasMatchingIds(playerIds, playerEntities)) return undefined;
    if (!Object.entries(playerEntities).every(([id, player]) => isScoreState(player, id))) {
        return undefined;
    }
    if (
        !Object.entries(gameEntities).every(
            ([id, game]) => isGameState(game, id, playerEntities)
        )
    ) {
        return undefined;
    }
    if (!isSettingsState(value.settings, gameEntities)) return undefined;

    const settings = Object.fromEntries(
        Object.entries(value.settings).filter(([key]) => key !== '_persist')
    ) as unknown as SettingsState;

    return {
        version: BACKUP_VERSION,
        exportedAt: value.exportedAt,
        games: {
            entities: gameEntities as Record<string, GameState>,
            ids: gameIds,
        },
        players: {
            entities: playerEntities as Record<string, ScoreState>,
            ids: playerIds,
        },
        settings: {
            ...initialSettings,
            ...settings,
        },
    };
};

export const exportBackup = async (): Promise<void> => {
    try {
        const state = store.getState();

        const backup: BackupData = {
            version: BACKUP_VERSION,
            exportedAt: Date.now(),
            games: {
                entities: state.games.entities,
                ids: state.games.ids,
            },
            players: {
                entities: state.players.entities,
                ids: state.players.ids,
            },
            settings: state.settings,
        };

        const json = JSON.stringify(backup, null, 2);
        const filename = `ScorePad_Backup_${new Date().toISOString().split('T')[0]}.json`;
        const backupFile = new File(Paths.cache, filename);
        backupFile.create({ overwrite: true });
        backupFile.write(json);

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(backupFile.uri, {
                mimeType: 'application/json',
                dialogTitle: 'Save ScorePad Backup',
            });
        } else {
            Alert.alert('Export Unavailable', 'Sharing is not available on this device.');
        }
    } catch {
        Alert.alert('Export Failed', 'An error occurred while exporting the backup.');
    }
};

export const importBackup = async (): Promise<void> => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/json',
            copyToCacheDirectory: true,
        });

        if (result.canceled) return;

        const file = result.assets[0];
        const backupFile = new File(file.uri);
        const content = await backupFile.text();

        let parsed: unknown;
        try {
            parsed = JSON.parse(content);
        } catch {
            Alert.alert('Import Failed', 'The selected file is not a valid JSON file.');
            return;
        }

        const backup = parseBackupData(parsed);
        if (!backup) {
            Alert.alert('Import Failed', 'The selected file is not a valid ScorePad backup.');
            return;
        }

        const dispatch = store.dispatch;
        dispatch(restoreAllGames(backup.games.entities));
        dispatch(restoreAllPlayers(backup.players.entities));
        dispatch(restoreSettings(backup.settings));

        Alert.alert('Restore Complete', 'Your data has been restored from the backup.');
    } catch {
        Alert.alert('Import Failed', 'An error occurred while importing the backup.');
    }
};
