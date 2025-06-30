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

Apple: `npx eas submit -p ios` or `npx eas submit -p ios --non-interactive`

Android: `npx eas submit -p android --changes-not-sent-for-review`

## Debug

### Expo

Use `npx expo start --dev-client` to run expo client in development mode.

Then use the dev client to launch React Dev Tools or debug JS remotely.

### EAS

Debug eas config settings: `npx eas config --platform=ios --profile=development`

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
