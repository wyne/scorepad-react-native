const { withDangerousMod, withPlugins } = require('@expo/config-plugins');
const {
    mergeContents
} = require('@expo/config-plugins/build/utils/generateCode');
const fs = require('fs');
const path = require('path');

async function readFileAsync(path) {
    return fs.promises.readFile(path, 'utf8');
}

async function saveFileAsync(path, content) {
    return fs.promises.writeFile(path, content, 'utf8');
}

const withFirebaseMods = (c) => {
    return withDangerousMod(c, [
        'ios',
        async (config) => {
            const file = path.join(config.modRequest.platformProjectRoot, 'Podfile');
            const contents = await readFileAsync(file);
            await saveFileAsync(file, addFirebaseConfigsToPodFile(contents));
            return config;
        }
    ]);
};

function addFirebaseConfigsToPodFile(src) {
    return mergeContents({
        tag: 'firebase-mods',
        src,
        newSrc: `
# install react-native-firebase as a static framework
$RNFirebaseAsStaticFramework = true
pod 'Firebase', :modular_headers => true
pod 'FirebaseCore', :modular_headers => true
pod 'GoogleUtilities', :modular_headers => true
`,
        anchor: /platform :ios/,
        offset: 0,
        comment: '#'
    }).contents;
}

module.exports = (config) => withPlugins(config, [withFirebaseMods]);
