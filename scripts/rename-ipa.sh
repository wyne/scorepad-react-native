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
	IFS='|' read -r semver build_number variant <<<"$(
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
" <<<"$raw"
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
	echo -e "${COLOR_BOLD}Select IPAs to rename${COLOR_RESET} (-m for multiple):"
	SELECTED_LINES=$(
		for f in "${IPAS[@]}"; do
			name=$(basename "$f")
			IFS='|' read -r semver build variant <<<"$(ipa_metadata "$f")"
			printf "%s|v%s (build %s)  %s|%s\n" "$name" "$semver" "$build" "$variant" "$f"
		done | fzf -m \
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
			2>/dev/null || true
	)
	if [ -z "$SELECTED_LINES" ]; then
		echo "Cancelled." >&2
		exit 1
	fi
	SELECTED_IPAS=()
	while IFS= read -r line; do
		SELECTED_IPAS+=("$(echo "$line" | cut -d'|' -f3)")
	done <<<"$SELECTED_LINES"
else
	echo -e "${COLOR_BOLD}Select IPAs to rename${COLOR_RESET} (comma-separated, e.g. 1,3,5):"
	for i in "${!IPAS[@]}"; do
		name=$(basename "${IPAS[$i]}")
		IFS='|' read -r semver build variant <<<"$(ipa_metadata "${IPAS[$i]}")"
		echo -e "  $((i + 1)). ${COLOR_CYAN}${name}${COLOR_RESET}  ${COLOR_YELLOW}v${semver} (build ${build})  ${variant}${COLOR_RESET}"
	done
	printf "Select IPAs [1-%d]: " "${#IPAS[@]}"
	read -r choices
	SELECTED_IPAS=()
	for idx in $(echo "$choices" | tr ',' ' '); do
		idx=$((idx - 1))
		if [ "$idx" -ge 0 ] && [ "$idx" -lt "${#IPAS[@]}" ]; then
			SELECTED_IPAS+=("${IPAS[$idx]}")
		fi
	done
	if [ ${#SELECTED_IPAS[@]} -eq 0 ]; then
		echo "Invalid selection" >&2
		exit 1
	fi
fi

echo -e "${COLOR_BOLD}Renaming ${#SELECTED_IPAS[@]} file(s):${COLOR_RESET}"
echo

# ---- Step 3: Rename each selected IPA ----
for IPA_PATH in "${SELECTED_IPAS[@]}"; do
	if [ ! -e "$IPA_PATH" ]; then
		echo -e "  ${COLOR_DIM}Skipping (not found): ${COLOR_RESET}$(basename "$IPA_PATH")"
		continue
	fi

	OLD_NAME=$(basename "$IPA_PATH")
	IFS='|' read -r semver build variant <<<"$(ipa_metadata "$IPA_PATH")"

	BASE="ScorePad_${variant}_v${semver}_b${build}"
	NEW_NAME="${BASE}.ipa"
	SUFFIX=2
	while [ -e "$ROOT_DIR/$NEW_NAME" ] && [ "$NEW_NAME" != "$OLD_NAME" ]; do
		NEW_NAME="${BASE}-${SUFFIX}.ipa"
		SUFFIX=$((SUFFIX + 1))
	done

	if [ "$NEW_NAME" = "$OLD_NAME" ]; then
		echo -e "  ${COLOR_DIM}Already renamed: ${COLOR_RESET}${OLD_NAME}"
		continue
	fi

	mv "$IPA_PATH" "$ROOT_DIR/$NEW_NAME"
	echo -e "  ${COLOR_GREEN}✓${COLOR_RESET}  ${COLOR_DIM}${OLD_NAME}${COLOR_RESET}  →  ${COLOR_CYAN}${NEW_NAME}${COLOR_RESET}"
done

echo
echo "${#SELECTED_IPAS[@]} file(s) processed."
