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
