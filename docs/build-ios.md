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

## Submit to App Store

```zsh
npx eas submit -p ios
npx eas submit -p ios --non-interactive
```
