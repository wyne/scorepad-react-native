#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

COLOR_RESET='\033[0m'
COLOR_BOLD='\033[1m'
COLOR_CYAN='\033[36m'
COLOR_YELLOW='\033[33m'
COLOR_DIM='\033[2m'

relative_time() {
    local epoch=$1 now diff
    now=$(date +%s)
    diff=$((now - epoch))
    if   [ $diff -lt 60 ];    then echo "just now"
    elif [ $diff -lt 3600 ];  then echo "$((diff / 60))m ago"
    elif [ $diff -lt 86400 ]; then echo "$((diff / 3600))h ago"
    elif [ $diff -lt 172800 ]; then echo "yesterday"
    else echo "$((diff / 86400))d ago"
    fi
}

ipa_info() {
    local f=$1 name=$2
    local ver="" ts="" rel=""
    if [[ "$name" =~ ^build-([0-9]+)\.ipa$ ]]; then
        local e=$((BASH_REMATCH[1] / 1000))
        ts=$(date -r "$e" "+%Y-%m-%d %H:%M" 2>/dev/null || echo "unknown")
        rel=$(relative_time "$e")
    fi
    if plist=$(unzip -p "$f" "Payload/*.app/Info.plist" 2>/dev/null); then
        ver=$(echo "$plist" | plutil -convert json -o - - 2>/dev/null | python3 -c "
import sys, json
d = json.load(sys.stdin)
b = d.get('CFBundleIdentifier', '')
v = d.get('CFBundleShortVersionString', '?')
n = d.get('CFBundleVersion', '?')
if b.endswith('.dev'): variant = 'dev'
elif b.endswith('.preview'): variant = 'preview'
else: variant = 'production'
print(f'v{v} (build {n})  {variant}')
" 2>/dev/null || echo "")
    fi
    echo "$ver|$ts|$rel"
}

# ---- Step 1: Pick an IPA ----
IPAS=()
while IFS= read -r f; do IPAS+=("$f"); done < <(ls -1t "$ROOT_DIR"/*.ipa 2>/dev/null || true)

if [ ${#IPAS[@]} -eq 0 ]; then
    echo "No .ipa files found in $ROOT_DIR" >&2
    exit 1
fi

if command -v fzf &>/dev/null; then
    echo "Select an IPA:"
    IPA_PATH=$(
        for f in "${IPAS[@]}"; do
            name=$(basename "$f")
            IFS='|' read -r ver ts rel <<< "$(ipa_info "$f" "$name")"
            rel_disp="${rel:-unknown}"
            printf "%s|%s|%s|%s|%s\n" "$rel_disp" "$name" "$ver" "$ts" "$f"
        done | fzf \
            --prompt='> ' \
            --with-nth='1..4' \
            --delimiter='|' \
            --preview "
                f=\$(echo {} | cut -d'|' -f5)
                unzip -p \"\$f\" 'Payload/*.app/Info.plist' 2>/dev/null | plutil -convert json -o - - 2>/dev/null | python3 -c \"
import sys, json
d = json.load(sys.stdin)
print('Identifier:', d.get('CFBundleIdentifier', '?'))
print('Version:', d.get('CFBundleShortVersionString', '?'))
print('Build:', d.get('CFBundleVersion', '?'))
print('Min OS:', d.get('MinimumOSVersion', '?'))
\" 2>/dev/null || echo 'No metadata available'
            " \
            --preview-window=right:40%:wrap \
            --height=~50% \
            2>/dev/null || true)
    if [ -z "$IPA_PATH" ]; then echo "Cancelled." >&2; exit 1; fi
    IPA_PATH=$(echo "$IPA_PATH" | cut -d'|' -f5)
else
    echo -e "${COLOR_BOLD}Select an IPA:${COLOR_RESET}"
    for i in "${!IPAS[@]}"; do
        name=$(basename "${IPAS[$i]}")
        IFS='|' read -r ver ts rel <<< "$(ipa_info "${IPAS[$i]}" "$name")"
        echo -e "  $((i+1)). ${COLOR_YELLOW}${rel:-unknown}${COLOR_RESET}  ${COLOR_CYAN}${name}${COLOR_RESET}  ${COLOR_DIM}${ver}${COLOR_RESET}  ${COLOR_DIM}${ts}${COLOR_RESET}"
    done
    printf "Select IPA [1-%d]: " "${#IPAS[@]}"
    read -r n; n=$((n - 1))
    if [ "$n" -lt 0 ] || [ "$n" -ge "${#IPAS[@]}" ]; then echo "Invalid selection" >&2; exit 1; fi
    IPA_PATH="${IPAS[$n]}"
fi

echo -e "Selected: ${COLOR_CYAN}$(basename "$IPA_PATH")${COLOR_RESET}"
echo

# ---- Step 2: List devices ----
echo "Fetching available devices..."
JSON=$(mktemp)
xcrun devicectl list devices --json-output "$JSON" >/dev/null 2>&1

DEVICES=()
while IFS=$'\t' read -r name id model; do
    DEVICES+=("$name|$id|$model")
done < <(python3 -c "
import json, sys
with open('$JSON') as f:
    data = json.load(f)
for d in data['result']['devices']:
    s = d.get('connectionProperties', {}).get('tunnelState', '')
    p = d.get('connectionProperties', {}).get('pairingState', '')
    if p != 'paired' or s == 'unavailable':
        continue
    name = d['deviceProperties']['name']
    ident = d['identifier']
    model = d.get('hardwareProperties', {}).get('productType', '')
    print(f'{name}\t{ident}\t{model}')
" 2>/dev/null)
rm -f "$JSON"

if [ ${#DEVICES[@]} -eq 0 ]; then
    echo "No available (paired) devices found. Make sure Wireless Debugging is enabled on your device." >&2
    exit 1
fi

if command -v fzf &>/dev/null; then
    echo "Select a device:"
    selected=$(
        for line in "${DEVICES[@]}"; do
            name=$(echo "$line" | cut -d'|' -f1)
            model=$(echo "$line" | cut -d'|' -f3)
            id=$(echo "$line" | cut -d'|' -f2)
            printf "%s|%s|%s\n" "$name" "$model" "$id"
        done | fzf \
            --prompt='> ' \
            --with-nth='1,2' \
            --delimiter='|' \
            --height=~50% \
            2>/dev/null || true)
    if [ -z "$selected" ]; then echo "Cancelled." >&2; exit 1; fi
    SELECTED_DEVICE=$(echo "$selected" | cut -d'|' -f3)
    SELECTED_NAME=$(echo "$selected" | cut -d'|' -f1)
else
    echo -e "${COLOR_BOLD}Select a device:${COLOR_RESET}"
    for i in "${!DEVICES[@]}"; do
        name=$(echo "${DEVICES[$i]}" | cut -d'|' -f1)
        model=$(echo "${DEVICES[$i]}" | cut -d'|' -f3)
        echo -e "  $((i+1)). ${COLOR_CYAN}${name}${COLOR_RESET}  ${COLOR_DIM}${model}${COLOR_RESET}"
    done
    printf "Select device [1-%d]: " "${#DEVICES[@]}"
    read -r n; n=$((n - 1))
    if [ "$n" -lt 0 ] || [ "$n" -ge "${#DEVICES[@]}" ]; then echo "Invalid selection" >&2; exit 1; fi
    SELECTED_DEVICE=$(echo "${DEVICES[$n]}" | cut -d'|' -f2)
    SELECTED_NAME=$(echo "${DEVICES[$n]}" | cut -d'|' -f1)
fi

echo -e "Selected: ${COLOR_CYAN}${SELECTED_NAME}${COLOR_RESET}"
echo

# ---- Step 3: Install ----
echo "Installing $(basename "$IPA_PATH")..."
xcrun devicectl device install app --device "$SELECTED_DEVICE" "$IPA_PATH"

echo
echo "Done."
