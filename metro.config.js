/* eslint-disable @typescript-eslint/no-require-imports */
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

// Sentry's wrapper of Expo's default config: adds debug ID injection and
// source map options so stack traces symbolicate in Sentry.
const defaultConfig = getSentryExpoConfig(__dirname);
// NOTE: do NOT add 'cjs' to assetExts — it prevents Metro from executing
// .cjs files as JavaScript (e.g. superstruct/dist/index.cjs gets treated as
// a binary asset instead of a module).

defaultConfig.resolver.blockList = [
    /\.maestro\/.*/,
    /\/e2e\/.*/,
];

module.exports = defaultConfig;
