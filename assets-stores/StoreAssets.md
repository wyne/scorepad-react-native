# Store Assets

App Store screenshots live here. They are excluded from EAS builds via `.easignore`.

## Layout

| Path | Contents |
| --- | --- |
| `raw/` | Unedited simulator captures (no captions) |
| `render.py` | Adds captions and renders every slot from `raw/` |
| `apple/<slot>/NN-name.png` | Final files to upload to App Store Connect |
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
2. Edit captions or the shot list in `render.py`.
3. `pip install pillow && python3 assets-stores/render.py`
4. Upload the files in `apple/` to App Store Connect by hand.
