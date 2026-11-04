import { isSaveToPhotosAvailable } from './savePhoto';

describe('isSaveToPhotosAvailable', () => {
    const nativeModule = { saveToLibraryAsync: jest.fn() };

    it('offers Save on iOS when the media library module is linked', () => {
        expect(isSaveToPhotosAvailable('ios', nativeModule)).toBe(true);
    });

    it('hides Save on an iOS build made without the media library module', () => {
        expect(isSaveToPhotosAvailable('ios', null)).toBe(false);
    });

    it('hides Save on Android', () => {
        expect(isSaveToPhotosAvailable('android', nativeModule)).toBe(false);
    });
});
