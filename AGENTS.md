# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

ScorePad with Rounds is a React Native app built with Expo SDK 56 for tracking game scores with round-by-round history. The app is cross-platform (iOS, Android, Web) and uses TypeScript throughout.

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

Production builds are cut by CI when a release is merged — see [Releases](#releases).
Do not bump the version by hand. To build production locally anyway:

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

## Releases

Releases are automated with [release-please](https://github.com/googleapis/release-please). Nothing about a release is typed by hand.

**How it works**

1. Every push to `main` updates a standing `chore: release X.Y.Z` pull request. The version and the changelog are derived from conventional-commit titles since the last release.
2. Merging that PR tags the merge commit `vX.Y.Z` and publishes the GitHub release. Because the tag is created from the same commit that carries the version bump, the file, tag, and release cannot disagree.
3. The release then queues an EAS production build for both platforms.
4. **Submission to the App Store / Play Console stays manual** — promote the finished binary from the [EAS dashboard](https://expo.dev/accounts/wyne/projects/scorepad/builds).

**Commit titles matter.** The next version is computed from them:

| Prefix | Effect |
|--------|--------|
| `fix:` | patch bump (3.0.4 → 3.0.5) |
| `feat:` | minor bump (3.0.4 → 3.1.0) |
| `feat!:` or `BREAKING CHANGE:` footer | major bump (3.0.4 → 4.0.0) |
| `chore:`, `docs:`, `ci:`, `build:`, `refactor:` | no bump; appears in the changelog |

A PR whose title does not parse produces no release at all, so `pr-checks.yml` enforces the format on every PR.

**Version sources**

- **User-facing version**: `version` in `package.json`, the single source of truth. `app.config.js` imports it, so the two can never drift. release-please owns this field — do not edit it manually.
- **Build numbers** (`versionCode` / `buildNumber`): managed remotely by EAS via `appVersionSource: "remote"` and `autoIncrement: true` on the production profile. They are deliberately absent from `app.config.js`; the build number auto-increments on every production build for the same user-facing version.

**Manual rebuild** of an existing tag: run the *Production Build* workflow from the Actions tab with the tag name.

**Required secrets**

| Secret | Purpose |
|--------|---------|
| `EXPO_TOKEN` | EAS authentication for production builds. Already configured. |
| `RELEASE_PLEASE_TOKEN` | Fine-grained PAT scoped to this repo, with **Contents: read and write**, **Pull requests: read and write**, and **Issues: read and write**. Optional but recommended: PRs opened with the default `GITHUB_TOKEN` do not trigger other workflows, so without it the release PR runs no checks until it is merged. Fine-grained PATs expire — when the release PR suddenly stops running checks, this is why. |

**Preflight**, run automatically on the release PR and before every production build, and available locally:

```bash
scripts/release-preflight.sh pr            # version not yet tagged
scripts/release-preflight.sh build v3.0.5  # tag matches package.json
```

It checks that `eas.json` is strict JSON, that `app.config.js` resolves to the `package.json` version, that no build number is hardcoded, that the tag and version agree, and that `expo-doctor` is clean.

**Seeding.** `.release-please-manifest.json` records the last *shipped* version and `last-release-sha` the commit it shipped from — `3.0.4` at `127ba46`, per EAS production build #59. Historical tags are inconsistent (`v.2.1.3`, `v2.2.2.57`) and `v3.0.4` was never tagged, so the sha is authoritative rather than the tag list. Neither field needs touching again; release-please maintains both.

**Remote build numbers.** To sync or reset one (e.g. after a rollback or when adopting remote for the first time):

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
