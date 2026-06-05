#!/bin/bash
# Finds the most recently built dev .app in DerivedData and installs it
# on all simulators configured for e2e. Run this after `npm run ios:dev`.
set -e

UDIDS=(
  "D94A02E7-4640-4351-9364-E8CC10D9C222"  # iPhone 17 Pro
  "F13A9725-1162-4594-8847-84161EBC9E42"  # iPhone 17 Pro Max
  "6A09F3D2-ED46-4F8C-95AF-A8F6A5E9F614"  # iPhone 17e
  "196BBCBC-2FF0-48EE-846C-D3B1DE58F493"  # iPad Pro 13-inch (M5)
)

APP=$(find "$HOME/Library/Developer/Xcode/DerivedData" \
  -name "ScorePadwithRounds.app" \
  -path "*/Debug-iphonesimulator/*" \
  -print0 2>/dev/null \
  | xargs -0 ls -dt \
  | head -1)

if [ -z "$APP" ]; then
  echo "Error: no ScorePadwithRounds.app found in DerivedData. Run 'npm run ios:dev' first." >&2
  exit 1
fi

echo "Installing: $APP"

for UDID in "${UDIDS[@]}"; do
  echo "  → $UDID"
  xcrun simctl boot "$UDID" 2>/dev/null || true
  xcrun simctl install "$UDID" "$APP"
done

echo "Done."
