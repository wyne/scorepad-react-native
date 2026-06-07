# iOS Build Guide

## Prerequisites

- macOS (required for iOS builds)
- Xcode (latest stable from Mac App Store)
- CocoaPods (`sudo gem install cocoapods`)
- After `expo prebuild`, install native pods: `cd ios && pod install && cd ..`

## Build Targets

| Goal | Command | Type | Location |
|------|---------|------|----------|
| Simulator (dev) | `npm run ios:dev` | Dev client | Local only |
| Simulator (preview) | `APP_VARIANT=preview npx expo run:ios --configuration Release` | Standalone | Local only |
| Simulator (production) | `npm run ios` | Dev client | Local only |
| Physical device (dev) | `npx eas build --profile development --platform ios` | Dev client | Local (`--local`) or Cloud |
| Physical device (preview) | `npx eas build --profile preview --platform ios` | Standalone | Local (`--local`) or Cloud |
| Store submission | `npx eas build --profile production --platform ios` | Release | Cloud only |

## Install IPA on Physical Device (Wireless)

Or use the interactive script from the project root:

```zsh
scripts/install-ipa.sh
```

Manual approach:

Requires the device to have **Wireless Debugging** enabled (Settings → Developer → Enable Wireless Debugging).

```zsh
# List available devices (wireless and wired)
xcrun devicectl list devices

# Install IPA (UDID from the list command above)
xcrun devicectl device install app --device <UDID> /path/to/app.ipa
```

You can also stream device logs while the app is running:

```zsh
xcrun devicectl device stream log --device <UDID>
```

## Production Build Checklist

Before a production build, bump the user-facing `version` in `app.config.js`:

```zsh
nvm use
npx expo-doctor
npx expo prebuild
npx eas build --platform ios
```

## Debug Firebase

```zsh
# Firebase Analytics (simulator)
xcrun simctl launch "iPhone 8" com.wyne.scorepad.dev -FIRAnalyticsDebugEnabled

# Firebase Crashlytics (simulator)
xcrun simctl launch "iPhone 14 Pro Max" com.wyne.scorepad.dev -FIRDebugEnabled
```

## App Store Screenshots (E2E Recording)

Screenshots are captured automatically across four simulators using WebdriverIO + Appium.

### Prerequisites

```zsh
npm install -g appium
appium driver install xcuitest
```

### Workflow

```zsh
# 1. Build and install the production app on one simulator
npm run ios

# 2. Push the built .app to all four e2e simulators
npm run e2e:install

# 3. Run the recording (all four devices in parallel)
npm run e2e
```

Screenshots land in `e2e/recordings/screenshots/<device-slug>/` and videos in `e2e/recordings/`.

### Devices

| Simulator | Role |
|-----------|------|
| iPhone 17 Pro | Development / baseline |
| iPhone 17 Pro Max | 6.9" App Store slot |
| iPhone 17e | Small phone slot |
| iPad Pro 13-inch (M5) | iPad App Store slot |

### Notes

- `e2e:install` finds the most recently built `ScorePadwithRounds.app` in DerivedData automatically — re-run it after each `ios:dev` build.
- Simulators must have the app pre-loaded with game data before recording. Load sample data via the dev menu inside the app after installing.
- `npm run e2e` runs all four devices in parallel; each writes its own screenshot set independently.

## Submit to App Store

```zsh
npx eas submit -p ios
npx eas submit -p ios --non-interactive
```
