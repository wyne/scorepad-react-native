const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  name: IS_DEV ? 'ScorePad with Rounds (dev)' : 'ScorePad with Rounds',
  slug: 'scorepad',
  ios: {
    bundleIdentifier: IS_DEV ? 'com.wyne.scorepad.dev' : 'com.wyne.scorepad',
    icon: './assets/icon-dev.png',
  },
  android: {
    package: IS_DEV ? 'com.wyne.scorepad.dev' : 'com.wyne.scorepad'
  },
  extra: {
    eas: {
      projectId: 'fc8859ea-b320-41cd-a091-36b3ec7f9b1f'
    }
  }
};
