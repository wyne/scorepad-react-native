# Android Build Guide

## Prerequisites

- **JDK 17** — install via Homebrew: `brew install --cask temurin@17`
- **Android Studio** — install the SDK Manager with:
  - Android SDK Platform (target API level)
  - Android SDK Build-Tools
  - Android Emulator
- Ensure `JAVA_HOME` points to JDK 17

## Build Commands

```bash
npm run android                          # Simulator/emulator (always local)
APP_VARIANT=development npx expo run:android  # Dev variant
APP_VARIANT=preview npx expo run:android      # Preview variant

npx eas build --profile development --platform android   # Physical device
npx eas build --profile preview --platform android       # Physical device
npx eas build --profile production --platform android    # Store submission
```

## Production Build Checklist

Before a production build, bump the user-facing `version` in `app.config.js`:

```zsh
nvm use
npx expo-doctor
npx expo prebuild
npx eas build --platform android
```

## Submit to Play Store

```zsh
npx eas submit -p android --changes-not-sent-for-review
```

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
