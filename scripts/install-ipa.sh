#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# ---- Step 1: Pick an IPA ----
IPAS=()
while IFS= read -r f; do
  IPAS+=("$f")
done < <(ls -1t "$ROOT_DIR"/*.ipa 2>/dev/null || true)

if [ ${#IPAS[@]} -eq 0 ]; then
  echo "No .ipa files found in $ROOT_DIR" >&2
  exit 1
fi

echo "Available .ipa files:"
for i in "${!IPAS[@]}"; do
  name=$(basename "${IPAS[$i]}")
  f="${IPAS[$i]}"

  # Parse timestamp from build-<epoch_ms>.ipa filename
  ts=""
  if [[ "$name" =~ ^build-([0-9]+)\.ipa$ ]]; then
    epoch_ms="${BASH_REMATCH[1]}"
    ts=$(date -r $((epoch_ms / 1000)) "+%Y-%m-%d %H:%M" 2>/dev/null || echo "unknown")
  fi
  mtime=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$f" 2>/dev/null || echo "")

  # Extract version/bundle info from IPA
  ver=""
  if plist=$(unzip -p "$f" "Payload/*.app/Info.plist" 2>/dev/null); then
    ver=$(echo "$plist" | plutil -convert json -o - - 2>/dev/null | python3 -c "
import sys, json
d = json.load(sys.stdin)
bundle = d.get('CFBundleIdentifier', '')
if bundle.endswith('.dev'): variant = 'dev'
elif bundle.endswith('.preview'): variant = 'preview'
else: variant = 'production'
v = d.get('CFBundleShortVersionString', '?')
b = d.get('CFBundleVersion', '?')
print(f'v{v} (build {b})  {variant}  {bundle}')
" 2>/dev/null || echo "")
  fi

  echo "  $((i+1)). $name"
  echo "     $ver    built: $ts"
done

printf "Select IPA [1-%d]: " "${#IPAS[@]}"
read -r ipa_idx
ipa_idx=$((ipa_idx - 1))
if [ "$ipa_idx" -lt 0 ] || [ "$ipa_idx" -ge "${#IPAS[@]}" ]; then
  echo "Invalid selection" >&2
  exit 1
fi
IPA_PATH="${IPAS[$ipa_idx]}"
echo "Selected: $IPA_PATH"
echo

# ---- Step 2: List devices ----
echo "Fetching available devices..."
DEVICES_JSON=$(mktemp)
xcrun devicectl list devices --json-output "$DEVICES_JSON" >/dev/null 2>&1

DEVICE_NAMES=()
DEVICE_IDS=()
while IFS=$'\t' read -r name id; do
  DEVICE_NAMES+=("$name")
  DEVICE_IDS+=("$id")
done < <(python3 -c "
import json, sys
with open('$DEVICES_JSON') as f:
    data = json.load(f)
for d in data['result']['devices']:
    state = d.get('connectionProperties', {}).get('tunnelState', '')
    pairing = d.get('connectionProperties', {}).get('pairingState', '')
    # Only show devices that are paired and reachable
    if pairing != 'paired':
        continue
    if state == 'unavailable':
        continue
    name = d['deviceProperties']['name']
    ident = d['identifier']
    model = d.get('hardwareProperties', {}).get('productType', '')
    print(f'{name}\t{ident}')
" 2>/dev/null)
rm -f "$DEVICES_JSON"

if [ ${#DEVICE_NAMES[@]} -eq 0 ]; then
  echo "No available (paired) devices found. Make sure Wireless Debugging is enabled on your device." >&2
  exit 1
fi

echo "Available devices:"
for i in "${!DEVICE_NAMES[@]}"; do
  echo "  $((i+1)). ${DEVICE_NAMES[$i]} (${DEVICE_IDS[$i]})"
done

printf "Select device [1-%d]: " "${#DEVICE_NAMES[@]}"
read -r dev_idx
dev_idx=$((dev_idx - 1))
if [ "$dev_idx" -lt 0 ] || [ "$dev_idx" -ge "${#DEVICE_NAMES[@]}" ]; then
  echo "Invalid selection" >&2
  exit 1
fi
SELECTED_DEVICE="${DEVICE_IDS[$dev_idx]}"
echo "Selected: ${DEVICE_NAMES[$dev_idx]} ($SELECTED_DEVICE)"
echo

# ---- Step 3: Install ----
echo "Installing $(basename "$IPA_PATH") on ${DEVICE_NAMES[$dev_idx]}..."
xcrun devicectl device install app --device "$SELECTED_DEVICE" "$IPA_PATH"

echo
echo "Done."
