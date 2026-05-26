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
npm install
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

Platform-specific build guides are in the [`docs/`](./docs/) directory:
- [`docs/build-ios.md`](./docs/build-ios.md) — Xcode, simulator/physical targets, App Store submission
- [`docs/build-android.md`](./docs/build-android.md) — Android Studio, all build variants, Windows (WSL) guide

## Testing

### Run Tests

```zsh
# Run tests once
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test -- --watch
```

### Coverage Requirements

- **Statements**: 24% minimum
- **Branches**: 18% minimum  
- **Functions**: 20% minimum
- **Lines**: 25% minimum

Coverage reports are generated in the `coverage/` directory and include:
- Text summary (console output)
- HTML report (`coverage/lcov-report/index.html`)
- LCOV format for CI integration

### Writing Tests

- Use React Native Testing Library for component tests
- Mock external dependencies (react-native-reanimated, navigation, etc.)
- Follow existing test patterns in the codebase
- Ensure tests are deterministic and don't rely on timers

## Code Quality

### Linting

```zsh
# Run ESLint and TypeScript checks
npm run lint

# Auto-fix linting issues where possible
npx eslint . --fix
```

### CI/CD

The project uses GitHub Actions for continuous integration:

#### Main Workflow (`node.yml`)
- Runs on push to `main` and all pull requests to `main`
- Executes linting, TypeScript checks, and full test suite with coverage
- Uploads coverage reports as GitHub artifacts
- Posts coverage summaries on pull requests

#### PR Checks (`pr-checks.yml`)
- Runs on all feature branches and pull requests
- Provides faster feedback with basic linting and testing
- Shows coverage summary in GitHub Actions summary

#### Quality Gates
- All tests must pass
- Code must pass ESLint rules
- TypeScript compilation must succeed
- Coverage thresholds must be met
- No merge to main without passing CI

### Pre-commit Checklist

Before creating a pull request:

1. Run `npm run lint` and fix any issues
2. Run `npm run test:coverage` and ensure all tests pass
3. Verify coverage hasn't decreased significantly
4. Test the app functionality manually
5. Update tests for any new features or bug fixes
