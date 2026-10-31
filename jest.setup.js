global.FormData = class FormData {
    constructor() {
        this.data = [];
    }
    append(key, value) {
        this.data.push({ key, value });
    }
};

// React Native 0.88 exports AssetRegistry from a private module that jest-expo's
// `react-native/asset-registry` mock doesn't cover, so point it at that mock.
jest.mock('./node_modules/react-native/src/private/assets/AssetRegistry', () => ({
    AssetRegistry: jest.requireMock('react-native/asset-registry'),
}));
