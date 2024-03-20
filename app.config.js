const variant = process.env.APP_VARIANT;

let packageName;
switch (variant) {
    case "development":
        packageName = "com.wyne.scorepad.dev";
        break;
    case "preview":
        packageName = "com.wyne.scorepad.preview";
        break;
    default:
        packageName = "com.wyne.scorepad";
        break;
}

let name;
switch (variant) {
    case "development":
        name = "ScorePad with Rounds (dev)";
        break;
    case "preview":
        name = "ScorePad with Rounds (preview)";
        break;
    default:
        name = "ScorePad with Rounds";
        break;
}

let icon;
switch (variant) {
    case "development":
        icon = "./assets/icon-dev.png";
        break;
    case "preview":
        icon = "./assets/icon-preview.png";
        break;
    default:
        icon = "./assets/icon.png";
        break;
}

export default {
    name: name,
    slug: "scorepad",
    version: "2.5.0",
    orientation: "default",
    icon: icon,
    assetBundlePatterns: ["assets/*"],
    backgroundColor: "#000000",
    ios: {
        bundleIdentifier: packageName,
        supportsTablet: true,
        requireFullScreen: false,
        buildNumber: "72",
        infoPlist: {
            RCTAsyncStorageExcludeFromBackup: false,
        },
        googleServicesFile: "./GoogleService-Info.plist",
    },
    android: {
        icon: "./assets/adaptive-icon.png",
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon-fg.png",
            backgroundImage: "./assets/adaptive-icon-bg.png",
        },
        package: packageName,
        permissions: [],
        versionCode: 72,
        googleServicesFile: "./google-services.json",
    },
    userInterfaceStyle: "dark",
    web: {
        favicon: "./assets/favicon.png",
    },
    extra: {
        eas: {
            projectId: "fc8859ea-b320-41cd-a091-36b3ec7f9b1f",
        },
    },
    updates: {
        fallbackToCacheTimeout: 0,
        url: "https://u.expo.dev/fc8859ea-b320-41cd-a091-36b3ec7f9b1f",
    },
    runtimeVersion: {
        policy: "sdkVersion",
    },
    description: "",
    githubUrl: "https://github.com/wyne/scorepad-react-native",
    owner: "wyne",
    plugins: [
        "@react-native-firebase/app",
        "@react-native-firebase/crashlytics",
        [
            "expo-build-properties",
            {
                ios: {
                    useFrameworks: "static",
                },
            },
        ],
    ],
    hooks: {},
};
