# Store Assets

App Store screenshots live here. They are excluded from EAS builds via `.easignore`.

## Layout

| Path | Contents |
| --- | --- |
| `raw/` | Unedited simulator captures (no captions) |
| `render.cjs` | HTML/CSS caption template; renders every slot from `raw/` with Playwright |
| `apple/<slot>/NN-name.jpg` | Final files to upload to App Store Connect |
| `feature-graphic.png` | Google Play feature graphic (1024×500) |

## Slots

| Folder | Size | App Store Connect slot |
| --- | --- | --- |
| `iPhone 6.1` | 1206×2622 | iPhone with Dynamic Island (medium), required |
| `iPhone 6.9` | 1320×2868 | iPhone with Dynamic Island (large) |
| `iPhone Duo outer` | 1398×2034 | iPhone Duo, outer display |
| `iPhone Duo inner (landscape)` / `(portrait)` | 2853×2007 / 2007×2853 | iPhone Duo, inner display |

Spec: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/

## Updating

1. Load sample data from the in-app dev menu and capture on the simulator
   (`xcrun simctl io booted screenshot raw/<name>.png`), or use the e2e flow in `docs/build-ios.md`.
   For the iPhone Duo outer display, add `--display=<outer display id>`; without it simctl captures the inner display.
2. Edit captions (`COPY`), the shot list (`SLOTS`) or the look (`template()`) in `render.cjs`.
3. `npm i --no-save playwright && npx playwright install chromium && node assets-stores/render.cjs`
4. Upload the files in `apple/` to App Store Connect by hand.
