# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ScorePad with Rounds is a React Native app built with Expo SDK 52 for tracking game scores with round-by-round history. The app is cross-platform (iOS, Android, Web) and uses TypeScript throughout.

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

```bash
# Development builds
npx eas build --profile development-simulator --platform ios --local
npx eas build --profile development-simulator --platform android --local

# Preview builds
npx eas build --platform ios --profile preview --local
npx eas build --platform android --profile preview --local

# Production builds (remember to bump version in app.config.js)
npx expo-doctor
npx expo prebuild
npx eas build --platform ios
npx eas build --platform android
```

## Architecture

### State Management

- **Redux Toolkit** with RTK Query for state management
- **Redux Persist** for data persistence with platform-specific storage:
  - iOS: iCloud storage via custom `iCloudStorage` utility
  - Android/Web: AsyncStorage
- Three main slices:
  - `GamesSlice`: Game entities with rounds, players, and metadata
  - `PlayersSlice`: Player entities with scores per round
  - `SettingsSlice`: App settings and preferences

### Navigation

- **React Navigation v6** with native stack navigator
- Main screens: List (Home), Game, Settings, Share, EditPlayer, Onboarding, AppInfo
- Custom headers for each screen using dedicated header components

### Key Components Structure

- `src/components/`: Reusable UI components organized by feature
  - `PlayerTiles/AdditionTile/`: Complex score display with animations
  - `Sheets/`: Bottom sheet modals with context providers
  - `Headers/`: Custom navigation headers
  - `Interactions/`: Touch interaction handling (HalfTap, Swipe)
- `src/screens/`: Main screen components
- `redux/`: State management with typed hooks and selectors

### Platform-Specific Features

- App variants for development/preview/production with different bundle IDs
- Firebase Analytics and Crashlytics integration
- iCloud document storage on iOS
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

## Development Notes

- Use `npx expo start --dev-client` for development with React DevTools
- Android development requires JDK 17
- Version bumping required in `app.config.js` for production builds
- EAS CLI used for building and submitting to stores
