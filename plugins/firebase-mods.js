/* eslint-disable @typescript-eslint/no-require-imports */
const { withAppDelegate } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

function modifyAppDelegateSwift(contents) {
  const configureCall = 'FirebaseApp.configure()';

  if (contents.includes(configureCall)) {
    return contents;
  }

  if (contents.includes('import FirebaseCore')) {
    return mergeContents({
      tag: 'firebase-mods-configure',
      src: contents,
      newSrc: configureCall,
      anchor: /let delegate = ReactNativeDelegate\(\)/,
      offset: 0,
      comment: '//',
    }).contents;
  }

  contents = mergeContents({
    tag: 'firebase-mods-import',
    src: contents,
    newSrc: 'import FirebaseCore',
    anchor: /^internal import Expo/m,
    offset: 1,
    comment: '//',
  }).contents;

  return mergeContents({
    tag: 'firebase-mods-configure',
    src: contents,
    newSrc: configureCall,
    anchor: /let delegate = ReactNativeDelegate\(\)/,
    offset: 0,
    comment: '//',
  }).contents;
}

module.exports = (config) => {
  return withAppDelegate(config, (config) => {
    if (config.modResults.language === 'swift') {
      config.modResults.contents = modifyAppDelegateSwift(config.modResults.contents);
    }
    return config;
  });
};
