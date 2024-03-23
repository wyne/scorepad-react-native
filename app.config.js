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

let androidIcon;
let androidIconBg;
switch (variant) {
    case "development":
        androidIcon = "./assets/adaptive-icon-dev.png";
        androidIconBg = "./assets/adaptive-icon-bg-dev.png";
        break;
    case "preview":
        androidIcon = "./assets/adaptive-icon-preview.png";
        androidIconBg = "./assets/adaptive-icon-bg-preview.png";
        break;
    default:
        androidIcon = "./assets/adaptive-icon.png";
        androidIconBg = "./assets/adaptive-icon-bg.png";
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
        buildNumber: "73",
        infoPlist: {
            RCTAsyncStorageExcludeFromBackup: false,
        },
        googleServicesFile: "./GoogleService-Info.plist",
    },
    android: {
        icon: androidIcon,
        adaptiveIcon: {
            foregroundImage: "./assets/adaptive-icon-fg.png",
            backgroundImage: androidIconBg,
        },
        package: packageName,
        permissions: [],
        versionCode: 73,
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
