# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

ScorePad with Rounds is a React Native app built with Expo SDK 55 for tracking game scores with round-by-round history. The app is cross-platform (iOS, Android, Web) and uses TypeScript throughout.

## Development Commands

### Setup

```bash
nvm use  # Use correct Node version
npx react-native-clean-project  # Clean project if needed
npx expo prebuild  # Generate native code
```

### Development

```bash
npm run dev  # Start development server with APP_VARIANT=development
npm start  # Standard expo start with dev client
npm run android  # Run on Android
npm run ios  # Run on iOS
```

### Testing and Linting

```bash
npm run test  # Run all tests with Jest
npm run test:watch  # Run tests in watch mode
npm run lint  # Run ESLint and TypeScript checks
```

### Building

All iOS build scripts use `--clean` on prebuild to prevent stale native code when switching between `APP_VARIANT` values. If you only need to regenerate native code without running the full build, use `npm run prebuild` or `npm run prebuild:clean`.

| Goal | Command | Type | Location |
|------|---------|------|----------|
| Simulator (dev) | `npm run ios:dev` | Dev client | Local only |
| Simulator (preview) | `npm run ios:preview` | Standalone | Local only |
| Simulator (production) | `npm run ios` | Standalone | Local only |
| Prebuild only | `npm run prebuild` | — | Local only |
| Prebuild (clean) | `npm run prebuild:clean` | — | Local only |
| Physical device (dev) | `npx eas build --profile development --platform ios` | Dev client | Local (`--local`) or Cloud |
| Physical device (preview) | `npx eas build --profile preview --platform ios` | Standalone | Local (`--local`) or Cloud |
| Store submission | `npx eas build --profile production --platform ios` | Release | Cloud only |

Android counterparts:

```bash
npm run android                          # Simulator/emulator (always local)
APP_VARIANT=development npx expo run:android  # Dev variant
APP_VARIANT=preview npx expo run:android      # Preview variant
npx eas build --profile development --platform android   # Physical device
npx eas build --profile preview --platform android       # Physical device
npx eas build --profile production --platform android    # Store submission
```

Before a production build, bump the user-facing `version` in `app.config.js`:

```bash
npx expo-doctor
npx expo prebuild --clean
npx eas build --platform ios
npx eas build --platform android
```

## Architecture

### State Management

- **Redux Toolkit** for state management
- **Redux Persist** for data persistence using AsyncStorage
- Three main slices:
  - `GamesSlice`: Game entities with rounds, players, and metadata
  - `PlayersSlice`: Player entities with scores per round
  - `SettingsSlice`: App settings and preferences

### Navigation

- **React Navigation v7** with native stack navigator
- Main screens: List (Home), Game, Settings, Share, EditPlayer, AppInfo, DebugLog
- Custom headers for each screen using dedicated header components

### Key Components Structure

- `src/components/`: Reusable UI components organized by feature
  - `PlayerTiles/AdditionTile/`: Complex score display with animations
  - `Sheets/`: Bottom sheet modals with context providers
  - `Headers/`: Custom navigation headers
  - `Interactions/`: Touch interaction handling (HalfTap, Swipe, Dial)
- `src/screens/`: Main screen components
- `redux/`: State management with typed hooks and selectors

### Platform-Specific Features

- App variants for development/preview/production with different bundle IDs
- Firebase Analytics, Auth, and Crashlytics integration
- Gesture handling with react-native-gesture-handler and react-native-reanimated

### Testing

- Jest with React Native Testing Library
- Custom mocks for Firebase, AsyncStorage, and react-native-video
- Test files co-located with source files using `.test.ts(x)` suffix

## Code Style

- ESLint with TypeScript rules, import ordering, and Prettier integration
- Single quotes, semicolons required
- Alphabetical import ordering with React imports first
- No disabled tests, imports organized by type (builtin, external, internal, etc.)

## Firebase Integration

- Analytics can be disabled via `EXPO_PUBLIC_FIREBASE_ANALYTICS=false`
- Debug mode available with simulator flags:
  - Analytics: `-FIRAnalyticsDebugEnabled`
  - Crashlytics: `-FIRDebugEnabled`

## Version Management

App versions are managed via EAS **remote** version source:

- **User-facing version** (`version` in `app.config.js`): bump manually before each store submission.
- **Build numbers** (`versionCode` / `buildNumber`): managed remotely by EAS. Set to `autoIncrement: true` on the production profile in `eas.json`. The build number auto-increments on every production build for the same user-facing version.

To sync or reset the remote build number (e.g. after a rollback or when adopting remote for the first time):

```bash
eas build:version:set
```

This prompts for platform, confirms switching to remote source, and lets you enter the starting build number.

To pull the remote version into your local project:

```bash
eas build:version:sync
```

## E2E and Screenshot Automation

WebdriverIO and Appium are used for automated UI flows and App Store screenshot generation.

### Setup

```bash
npm install -g appium
appium driver install xcuitest
```

### Build for E2E Recording

Build a standalone app for the simulator:

```bash
npm run ios
```

### Run Flows

Install the built app on the e2e simulators, then run the recording flow:

```bash
npm run e2e:install  # Install latest built .app on e2e simulators
npm run e2e          # Run Appium/WebdriverIO screenshot flow
npm run e2e:record   # Record the e2e flow
```

Screenshots are written to `e2e/recordings/screenshots/<device-slug>/`, and videos are written to `e2e/recordings/`.

### testID Conventions

Components use `testID` props for reliable test selectors:

- `home-screen` — ListScreen root view
- `add-game-button` — Floating action button
- `game-list-item` — Game list rows
- `game-title-input` — Game title text input
- `game-screen` — GameScreen root view
- `game-options-menu` — Game options menu button
- `edit-game-and-players` — Edit game and players button
- `choose-winners-button` — Choose winners button
- `lock-game-button` — Lock game button
- Add more as flows are created

## Development Notes

- Use `npx expo start --dev-client` for development with React DevTools
- Android development requires JDK 17
- EAS CLI used for building and submitting to stores
