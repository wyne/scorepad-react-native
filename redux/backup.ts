import * as DocumentPicker from 'expo-document-picker';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

import { GameState, restoreAllGames } from './GamesSlice';
import { ScoreState, restoreAllPlayers } from './PlayersSlice';
import { restoreSettings, SettingsState } from './SettingsSlice';
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

        let backup: BackupData;
        try {
            backup = JSON.parse(content);
        } catch {
            Alert.alert('Import Failed', 'The selected file is not a valid JSON file.');
            return;
        }

        if (!backup.games?.entities || !backup.players?.entities) {
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
