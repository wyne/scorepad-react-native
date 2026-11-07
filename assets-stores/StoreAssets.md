# Store Assets

App Store screenshots live here. They are excluded from EAS builds via `.easignore`.

## Layout

| Path | Contents |
| --- | --- |
| `raw/` | Unedited simulator captures (no captions) |
| `render.cjs` | HTML/CSS caption template; renders every slot from `raw/` with Playwright |
| `upload.cjs` | Uploads `apple/` to App Store Connect through the API |
| `apple/<slot>/NN-name.jpg` | Final files to upload to App Store Connect |
| `google/<slot>/NN-name.jpg` | Final files to upload to Google Play Console |
| `feature-graphic.png` | Google Play feature graphic (1024×500) |

## Slots

| Folder | Size | App Store Connect slot |
| --- | --- | --- |
| `iPad 13` | 2064×2752 | iPad 13-inch, required for iPad |
| `iPhone 6.1` | 1206×2622 | iPhone with Dynamic Island (medium), required |
| `iPhone 6.9` | 1320×2868 | iPhone with Dynamic Island (large) |
| `iPhone Duo outer` | 1398×2034 | iPhone Duo, outer display |
| `iPhone Duo inner (landscape)` / `(portrait)` | 2853×2007 / 2007×2853 | iPhone Duo, inner display |

Google Play (`google/`):

| Folder | Size | Play Console slot |
| --- | --- | --- |
| `phone` | 1080×1920 | Phone screenshots |
| `tablet` | 1440×2560 | 7-inch and 10-inch tablet screenshots |

Raws: `raw/android-*.png` (Pixel phone emulator, 1080×2424) and `raw/android-tablet-*.png` (1600×2560 tablet
emulator), captured from a release preview build (`npm run android:preview`) with `adb exec-out screencap -p`,
dark mode (`adb shell cmd uimode night yes`) and SystemUI demo mode for a clean 9:41 status bar.

Spec: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/

## Updating

1. Load sample data from the in-app dev menu and capture on the simulator
   (`xcrun simctl io booted screenshot raw/<name>.png`), or use the e2e flow in `docs/build-ios.md`.
   For iPad, capture on the iPad Pro 13-inch (M5) simulator in portrait as `raw/ipad-board.png`, `ipad-dial.png`,
   `ipad-history.png`, `ipad-point-values.png` and `ipad-games.png` (same screens as the iPhone set).
   For the iPhone Duo outer display, add `--display=<outer display id>`; without it simctl captures the inner display.
2. Edit captions (`COPY`), the shot list (`SLOTS`) or the look (`template()`) in `render.cjs`.
3. `npm i --no-save playwright && npx playwright install chromium && node assets-stores/render.cjs`
4. Upload with the App Store Connect API. Create a key under Users and Access > Integrations
   (App Manager role), then, with an editable version in "Prepare for Submission":
   ```sh
   export ASC_KEY_ID=XXXXXXXXXX ASC_ISSUER_ID=xxxxxxxx-... ASC_KEY_PATH=~/AuthKey_XXXXXXXXXX.p8
   node assets-stores/upload.cjs --dry-run   # list what goes where
   node assets-stores/upload.cjs             # replace all sets for en-US
   ```
   Options: `--slot "iPad 13"` (repeatable), `--locale`, `--version`, `--no-duo`. Each display type's set is
   replaced as a whole. The iPhone Duo type (`APP_IPHONE_DUO`) isn't in Apple's published API spec yet; if it's
   rejected, rerun with `--no-duo` and upload those by hand.

   From CI: Actions > **Upload App Store Screenshots** > Run workflow (same options as inputs). It needs repository
   secrets `ASC_KEY_ID`, `ASC_ISSUER_ID` and `ASC_KEY_P8` (the full text of the .p8 file).
