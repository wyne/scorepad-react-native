import { Platform } from 'react-native';

/**
 * Whether the share screen offers its own Save to Photos action. iOS only:
 * Android's share sheet already offers saving through the gallery or files
 * apps, and expo-media-library isn't linked there (see package.json) so the
 * app doesn't pick up its storage permissions.
 */
export const canSaveToPhotos = Platform.OS === 'ios';

/** Saves an image file to the photo library, with add-only access. */
export const saveImageToPhotos = async (uri: string): Promise<void> => {
    // Loaded on demand: the native module only exists where it's linked.
    const { saveToLibraryAsync } = await import('expo-media-library/legacy');
    await saveToLibraryAsync(uri);
};
