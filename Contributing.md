## Setup

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| nvm | latest | Node version manager |
| Node.js | 20.18 (via `.nvmrc`) | Installed via `nvm` |
| npm | (bundled with Node) | Used for all JS dependencies |
| EAS CLI | latest | Required for building and submitting |
| JDK | 17 | Android builds only |
| Xcode | latest stable | iOS builds only (macOS required) |
| Android Studio | latest stable | Android builds only (includes Android SDK) |
| CocoaPods | latest | iOS native code after `expo prebuild` |

### Install nvm & Node

```zsh
# Install nvm — https://github.com/nvm-sh/nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# From the project root — installs and activates the version in .nvmrc (20.18)
nvm install
nvm use
```

### Install project dependencies

```zsh
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` is required because some packages (e.g. `@reduxjs/toolkit`) have not yet declared React 19 peer dependency support, though they are compatible.

### Install EAS CLI

```zsh
npm install -g eas-cli
eas login     # authenticate with your Expo account
eas whoami    # verify login
```

### iOS — Xcode & CocoaPods

- Install Xcode from the Mac App Store and accept the license agreement
- Install CocoaPods:

```zsh
sudo gem install cocoapods
```

- After running `expo prebuild`, install native iOS dependencies:

```zsh
cd ios && pod install && cd ..
```

### Android — JDK 17 & Android Studio

- Install JDK 17 (e.g. via Homebrew: `brew install --cask temurin@17`)
- Install [Android Studio](https://developer.android.com/studio) and open the SDK Manager to install:
  - Android SDK Platform (target API level)
  - Android SDK Build-Tools
  - Android Emulator
- Ensure `JAVA_HOME` points to your JDK 17 installation

---

## Build

Run any build command remotely by removing `--local` flag.

### Development - Simulator

For android, use JDK 17.

```zsh
nvm use

npx react-native-clean-project
npx expo prebuild
npx eas build --profile development-simulator --platform ios --local
npx eas build --profile development-simulator --platform android --local
npx eas build:run -p ios # select expo build from above
npx eas build:run -p android # select expo build from above
npx expo start --dev-client
```

Debug Firebase events by running simulator with `FIRAnalyticsDebugEnabled` flag:
`xcrun simctl launch "iPhone 8" com.wyne.scorepad.dev -FIRAnalyticsDebugEnabled`

Debug Firebase Crashlytics by running simulator with `FIRDebugEnabled` flag:
`xcrun simctl launch "iPhone 14 Pro Max" com.wyne.scorepad.dev -FIRDebugEnabled`

### Development - Physical Device

```zsh
nvm use

npx expo prebuild -p ios
npx eas build --platform ios --profile development --local

npx expo prebuild -p android
npx eas build --platform android --profile development --local
```

### Preview Build (Standalone)

```zsh
nvm use

npx expo prebuild -p ios
npx eas-cli build --platform ios --profile preview --local

npx expo prebuild -p android
npx eas-cli build --platform android --profile preview --local
```

### Production Build

Remember to bump `versionCode` and `buildNumber` in `app.config.js`.

```zsh
nvm use

npx expo-doctor
npx expo prebuild
npx eas build --platform ios
npx eas build --platform android
```

## Run

Use a development build from above, then: `npx expo start --dev-client`

## Publish

Apple: `eas submit -p ios` or `eas submit -p ios --non-interactive`

Android: `eas submit -p android --changes-not-sent-for-review`

## Debug

### Expo

Use `npx expo start --dev-client` to run expo client in development mode.

Then use the dev client to launch React Dev Tools or debug JS remotely.

### EAS

Debug eas config settings: `eas config --platform=ios --profile=development`
