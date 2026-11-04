import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

/**
 * Whether the share screen offers its own Save to Photos action. iOS only:
 * Android's share sheet already offers saving through the gallery or files
 * apps, and expo-media-library isn't linked there (see package.json) so the
 * app doesn't pick up its storage permissions.
 *
 * Also requires the native module to be in the binary. The runtime version
 * follows the SDK version, so this JS can reach builds made before
 * expo-media-library was added (an OTA update or an old dev client). Those
 * builds also lack the photo library usage description, so they hide Save.
 */
export const isSaveToPhotosAvailable = (
    os: string = Platform.OS,
    nativeModule: unknown = requireOptionalNativeModule('ExpoMediaLibrary'),
): boolean => os === 'ios' && nativeModule != null;

export const canSaveToPhotos = isSaveToPhotosAvailable();

/** Saves an image file to the photo library, with add-only access. */
export const saveImageToPhotos = async (uri: string): Promise<void> => {
    // Loaded on demand: the native module only exists where it's linked.
    const { saveToLibraryAsync } = await import('expo-media-library/legacy');
    await saveToLibraryAsync(uri);
};
