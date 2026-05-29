#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

COLOR_RESET='\033[0m'
COLOR_BOLD='\033[1m'
COLOR_CYAN='\033[36m'
COLOR_YELLOW='\033[33m'
COLOR_DIM='\033[2m'
COLOR_GREEN='\033[32m'

ipa_metadata() {
    local f=$1
    local semver="?" build_number="?" variant="unknown"
    local raw
    raw=$(unzip -p "$f" "Payload/*.app/Info.plist" 2>/dev/null) || return
    IFS='|' read -r semver build_number variant <<< "$(
        python3 -c "
import sys, plistlib
try:
    d = plistlib.loads(sys.stdin.buffer.read())
except Exception:
    print('?|?|unknown')
    sys.exit(0)
b = d.get('CFBundleIdentifier', '')
v = d.get('CFBundleShortVersionString', '?')
n = d.get('CFBundleVersion', '?')
if b.endswith('.dev'): variant = 'dev'
elif b.endswith('.preview'): variant = 'preview'
else: variant = 'production'
print(f'{v}|{n}|{variant}')
" <<< "$raw"
    )"
    echo "$semver|$build_number|$variant"
}

# ---- Step 1: Pick an IPA ----
IPAS=()
while IFS= read -r f; do IPAS+=("$f"); done < <(find "$ROOT_DIR" -maxdepth 1 -name '*.ipa' -print0 2>/dev/null | xargs -0 ls -1t 2>/dev/null || true)

if [ ${#IPAS[@]} -eq 0 ]; then
    echo "No .ipa files found in $ROOT_DIR" >&2
    exit 1
fi

if command -v fzf &>/dev/null && [ -t 0 ]; then
    echo "Select an IPA to rename:"
    IPA_PATH=$(
        for f in "${IPAS[@]}"; do
            name=$(basename "$f")
            IFS='|' read -r semver build variant <<< "$(ipa_metadata "$f")"
            printf "%s|v%s (build %s)  %s|%s\n" "$name" "$semver" "$build" "$variant" "$f"
        done | fzf \
            --prompt='> ' \
            --with-nth='1..3' \
            --delimiter='|' \
            --preview "
                f=\$(echo {} | cut -d'|' -f3)
                unzip -p \"\$f\" 'Payload/*.app/Info.plist' 2>/dev/null | python3 -c \"
import sys, plistlib
try:
    d = plistlib.loads(sys.stdin.buffer.read())
    print('Identifier:', d.get('CFBundleIdentifier', '?'))
    print('Version:', d.get('CFBundleShortVersionString', '?'))
    print('Build:', d.get('CFBundleVersion', '?'))
    print('Min OS:', d.get('MinimumOSVersion', '?'))
except:
    print('No metadata available')
\" 2>/dev/null || echo 'No metadata available'
            " \
            --preview-window=right:40%:wrap \
            --height=~50% \
            2>/dev/null || true)
    if [ -z "$IPA_PATH" ]; then echo "Cancelled." >&2; exit 1; fi
    IPA_PATH=$(echo "$IPA_PATH" | cut -d'|' -f3)
else
    echo -e "${COLOR_BOLD}Select an IPA to rename:${COLOR_RESET}"
    for i in "${!IPAS[@]}"; do
        name=$(basename "${IPAS[$i]}")
        IFS='|' read -r semver build variant <<< "$(ipa_metadata "${IPAS[$i]}")"
        echo -e "  $((i+1)). ${COLOR_CYAN}${name}${COLOR_RESET}  ${COLOR_YELLOW}v${semver} (build ${build})  ${variant}${COLOR_RESET}"
    done
    printf "Select IPA [1-%d]: " "${#IPAS[@]}"
    read -r n; n=$((n - 1))
    if [ "$n" -lt 0 ] || [ "$n" -ge "${#IPAS[@]}" ]; then echo "Invalid selection" >&2; exit 1; fi
    IPA_PATH="${IPAS[$n]}"
fi

OLD_NAME=$(basename "$IPA_PATH")
IFS='|' read -r semver build variant <<< "$(ipa_metadata "$IPA_PATH")"

# ---- Step 2: Build new filename with auto-increment ----
BASE="ScorePad_${variant}_v${semver}_b${build}"
NEW_NAME="${BASE}.ipa"
SUFFIX=2
while [ -e "$ROOT_DIR/$NEW_NAME" ]; do
    NEW_NAME="${BASE}-${SUFFIX}.ipa"
    SUFFIX=$((SUFFIX + 1))
done

mv "$IPA_PATH" "$ROOT_DIR/$NEW_NAME"

echo -e "${COLOR_GREEN}Renamed:${COLOR_RESET}"
echo -e "  ${COLOR_DIM}${OLD_NAME}${COLOR_RESET}  →  ${COLOR_CYAN}${NEW_NAME}${COLOR_RESET}"
