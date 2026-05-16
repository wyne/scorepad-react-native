const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
// NOTE: do NOT add 'cjs' to assetExts — it prevents Metro from executing
// .cjs files as JavaScript (e.g. superstruct/dist/index.cjs gets treated as
// a binary asset instead of a module).

module.exports = defaultConfig;
