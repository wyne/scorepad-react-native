const variant = process.env.APP_VARIANT;

let packageName;
switch (variant) {
  case 'development':
    packageName = 'com.wyne.scorepad.dev';
    break;
  case 'preview':
    packageName = 'com.wyne.scorepad.preview';
    break;
  default:
    packageName = 'com.wyne.scorepad';
    break;
}

let displayName;
switch (variant) {
  case 'development':
    displayName = 'ScorePad (dev)';
    break;
  case 'preview':
    displayName = 'ScorePad (preview)';
    break;
  default:
    displayName = 'ScorePad with Rounds';
    break;
}

let icon;
switch (variant) {
  case 'development':
    icon = './assets/icon-dev.png';
    break;
  case 'preview':
    icon = './assets/icon-preview.png';
    break;
  default:
    icon = './assets/icon.png';
    break;
}

let googleServicesFile;
switch (variant) {
  case 'development':
    googleServicesFile = './GoogleService-Info-dev.plist';
    break;
  case 'preview':
    googleServicesFile = './GoogleService-Info-preview.plist';
    break;
  default:
    googleServicesFile = './GoogleService-Info.plist';
    break;
}

let androidIcon;
let androidIconBg;
switch (variant) {
  case 'development':
    androidIcon = './assets/adaptive-icon-dev.png';
    androidIconBg = './assets/adaptive-icon-bg-dev.png';
    break;
  case 'preview':
    androidIcon = './assets/adaptive-icon-preview.png';
    androidIconBg = './assets/adaptive-icon-bg-preview.png';
    break;
  default:
    androidIcon = './assets/adaptive-icon.png';
    androidIconBg = './assets/adaptive-icon-bg.png';
    break;
}

export default {
  name: 'ScorePad with Rounds',
  slug: 'scorepad',
  version: '3.0.2',
  orientation: 'default',
  icon: icon,
  assetBundlePatterns: ['assets/*'],
  backgroundColor: '#F2F2F7',
  ios: {
    bundleIdentifier: packageName,
    supportsTablet: true,
    requireFullScreen: false,
    infoPlist: {
      CFBundleDisplayName: displayName,
      RCTAsyncStorageExcludeFromBackup: false,
      ITSAppUsesNonExemptEncryption: false,
    },
    googleServicesFile: googleServicesFile,
  },
  android: {
    icon: androidIcon,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon-fg.png',
      backgroundImage: androidIconBg,
    },
    package: packageName,
    permissions: [],
    blockedPermissions: ['android.permission.ACTIVITY_RECOGNITION'],
    versionCode: 88,
    googleServicesFile: './google-services.json',
  },
  userInterfaceStyle: 'automatic',
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    eas: {
      projectId: 'fc8859ea-b320-41cd-a091-36b3ec7f9b1f',
    },
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/fc8859ea-b320-41cd-a091-36b3ec7f9b1f',
  },
  runtimeVersion: {
    policy: 'sdkVersion',
  },
  description: '',
  githubUrl: 'https://github.com/wyne/scorepad-react-native',
  owner: 'wyne',
  plugins: [
    // Listed BEFORE expo-splash-screen: Expo runs the most recently registered
    // mod first, so an earlier-listed plugin's withAndroidStyles mod runs LAST,
    // i.e. after expo-splash-screen has written its style items.
    './plugins/withAndroidSplashNoIcon',
    ['expo-splash-screen', {
      backgroundColor: '#F2F2F7',
      dark: { backgroundColor: '#000000' },
    }],
    './plugins/withTouchVisualizer',
    'expo-font',
    '@react-native-firebase/app',
    '@react-native-firebase/crashlytics',
    'expo-image',
    'expo-sharing',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          forceStaticLinking: ['RNFBApp', 'RNFBAnalytics', 'RNFBCrashlytics'],
        },
      },
    ],
    [
      'expo-dev-client',
      {
        launchMode: 'most-recent',
        skipOnboarding: true,
      },
    ],
  ],
};
