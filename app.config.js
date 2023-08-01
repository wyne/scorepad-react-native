const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  name: IS_DEV ? 'ScorePad with Rounds (dev)' : 'ScorePad with Rounds',
  slug: 'scorepad',
  version: "2.1.10",
  orientation: "default",
  icon: IS_DEV ? './assets/icon-dev.png' : './assets/icon.png',
  assetBundlePatterns: [
    "assets/*"
  ],
  backgroundColor: "#000000",
  ios: {
    bundleIdentifier: IS_DEV ? 'com.wyne.scorepad.dev' : 'com.wyne.scorepad',
    supportsTablet: true,
    requireFullScreen: false,
    buildNumber: "51",
    infoPlist: {
      RCTAsyncStorageExcludeFromBackup: false
    },
    googleServicesFile: "./GoogleService-Info.plist",
  },
  android: {
    icon: "./assets/adaptive-icon.png",
    adaptiveIcon: {
      "foregroundImage": "./assets/adaptive-icon-fg.png",
      "backgroundImage": "./assets/adaptive-icon-bg.png"
    },
    package: IS_DEV ? 'com.wyne.scorepad.dev' : 'com.wyne.scorepad',
    permissions: [],
    versionCode: 51,
    googleServicesFile: "./google-services.json",
  },
  userInterfaceStyle: "dark",
  web: {
    "favicon": "./assets/favicon.png"
  },
  extra: {
    eas: {
      projectId: 'fc8859ea-b320-41cd-a091-36b3ec7f9b1f'
    }
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: "https://u.expo.dev/fc8859ea-b320-41cd-a091-36b3ec7f9b1f"
  },
  runtimeVersion: {
    policy: "sdkVersion",
  },
  description: "",
  githubUrl: "https://github.com/wyne/scorepad-react-native",
  owner: "wyne",
  plugins: [
    "sentry-expo",
    [
      "expo-screen-orientation",
      {
        "initialOrientation": "DEFAULT"
      }
    ],
    "@react-native-firebase/app",
    [
      "expo-build-properties",
      {
        "ios": {
          "useFrameworks": "static"
        }
      }
    ]
  ],
  hooks: {
    "postPublish": [
      {
        "file": "sentry-expo/upload-sourcemaps",
        "config": {
          "organization": "justin-wyne",
          "project": "scorepad",
          "authToken": false
        }
      }
    ]
  }
};
