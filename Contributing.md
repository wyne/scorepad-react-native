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

## Windows (WSL) Setup

When developing on Windows, the recommended setup is to keep your code and terminal inside WSL2
while running Android Studio and the emulator natively on Windows. Three things need to be wired
up: the Android SDK path, the ADB server connection, and Metro bundler port access.

### 1. Point WSL to the Windows Android SDK

Add to `~/.bashrc` or `~/.zshrc`, replacing `<YourUsername>` with your Windows username:

```zsh
export ANDROID_HOME=/mnt/c/Users/<YourUsername>/AppData/Local/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin

# Points WSL's adb client at the Windows ADB server via the WSL gateway IP
export ANDROID_ADB_SERVER_HOST=$(ip route | grep default | awk '{print $3}')
```

Reload your shell:

```zsh
source ~/.bashrc
```

### 2. Install JDK 17 in WSL

Required for `--local` builds. Install JDK 17 inside WSL (do not rely on the Windows JDK):

```zsh
sudo apt update && sudo apt install -y openjdk-17-jdk
```

Add to `~/.bashrc` or `~/.zshrc`:

```zsh
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$PATH:$JAVA_HOME/bin
```

### 3. ADB Connectivity

#### Windows Prerequisites

**A. Fix PowerShell execution policy**

Windows blocks all scripts by default. Run this once in PowerShell (no admin required):

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

This allows local scripts to run. Restart PowerShell after running it.

**B. Add `adb` to the Windows PATH**

Android Studio does not add `adb` to the PATH automatically. Add the `platform-tools` directory:

*Via PowerShell (one-liner):*
```powershell
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk\platform-tools"
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$sdkPath", "User")
```

*Or via System Settings:*
1. Open Start → search "Edit the system environment variables"
2. Click "Environment Variables"
3. Under "User variables", select `Path` → Edit → New
4. Add: `C:\Users\<YourUsername>\AppData\Local\Android\Sdk\platform-tools`
5. Click OK

Restart PowerShell, then verify:

```powershell
adb --version
```

---

WSL2 uses NAT networking — WSL's `adb` cannot reach the Windows ADB server on `localhost` by
default. The fix is a Windows port proxy that forwards the ADB port from the Windows gateway IP
to the local ADB server.

**Connect WSL ADB to the Windows ADB server**

Run once from **Windows PowerShell as Administrator**:

```powershell
# Start the Windows ADB server (daemonized)
adb start-server

# Forward the ADB port from the WSL-facing gateway IP to localhost
netsh interface portproxy add v4tov4 listenaddress=172.18.192.1 listenport=5037 connectaddress=127.0.0.1 connectport=5037

# Allow the connection through the firewall
netsh advfirewall firewall add rule name="WSL ADB" dir=in action=allow protocol=TCP localport=5037
```

> The `listenaddress` (`172.18.192.1`) is the default WSL2 gateway IP. If your gateway is
> different, check it from WSL with: `ip route | grep default`

Verify from WSL (with an emulator running):

```zsh
adb devices   # should list the running emulator
```

### 4. Metro Bundler Port Forwarding

`npx expo start --dev-client` runs Metro inside WSL on port 8081. The Android emulator on Windows
cannot reach WSL's `localhost` by default. Choose one of the following options:

**Option A — Windows port proxy** (works on any Windows/WSL2 version)

Run from a **Windows PowerShell window as Administrator** (re-run after each WSL restart, since
the WSL IP changes):

```powershell
$wslIp = (wsl hostname -I).Trim().Split(" ")[0]
netsh interface portproxy add v4tov4 listenport=8081 listenaddress=0.0.0.0 connectport=8081 connectaddress=$wslIp
netsh interface portproxy add v4tov4 listenport=19000 listenaddress=0.0.0.0 connectport=19000 connectaddress=$wslIp
```

**Option B — Expo Tunnel** (simplest, no port forwarding needed)

```zsh
npx expo start --dev-client --tunnel
```

Requires a free Expo account. Routes traffic through ngrok.

**Option C — WSL Mirrored Networking** (Windows 11, see step 3 above)

With `networkingMode=mirrored` no port forwarding is needed.

### 5. Run on Android Emulator

**1. Start an emulator in Android Studio (Windows)**

- Open Android Studio → Device Manager (from the toolbar or View menu)
- Click the play (▶) button next to a virtual device and wait for it to fully boot

**2. Verify ADB sees the emulator from WSL**

```zsh
adb devices
```

Expected output:
```
List of devices attached
emulator-5554   device
```

If nothing appears, ensure the Windows ADB server is running (`adb start-server` from a Windows
terminal) and that the port proxy from step 3 is active.

**3. Build the development app (from WSL project root)**

```zsh
nvm use
npx expo prebuild --platform android
eas build --profile development --platform android --local
```

> Use `--platform android` with `expo prebuild` to skip iOS. The `@react-native-firebase` iOS
> plugin is incompatible with the Swift AppDelegate in Expo 53 and will error if you prebuild
> for both platforms on a non-Mac machine.

> The project includes a `.npmrc` with `legacy-peer-deps=true` so the build's internal
> `npm ci` step resolves correctly with React 19.

This compiles the APK using the Android SDK at `$ANDROID_HOME`. The first build takes several
minutes; subsequent builds are faster.

**4. Install on the running emulator**

```zsh
npx eas build:run -p android   # select the build from the list
```

**5. Start Metro**

```zsh
npx expo start --dev-client
```

Ensure Windows port forwarding from step 4 above is active so the emulator can reach Metro.

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
