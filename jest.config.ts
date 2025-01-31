import type { Config } from 'jest';

const config: Config = {
    preset: 'jest-expo',
    transform: {
        '^.+\\.tsx?$': 'babel-jest',
    },
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
    ],
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    setupFiles: ['./jest.setup.js'],
    setupFilesAfterEnv: [
        '@testing-library/jest-native/extend-expect',
    ],
    moduleNameMapper: {
        '^react-native-video$': '__mocks__/react-native-video.js'
    }
};

export default config;
