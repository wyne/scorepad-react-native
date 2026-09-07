#!/usr/bin/env bash
#
# Release preflight checks.
#
# Guards the invariants that used to be maintained by hand: that the version in
# package.json is the version Expo actually ships, that eas.json is machine
# readable, and that a tag and the version it claims to point at agree.
#
# Usage:
#   scripts/release-preflight.sh pr              # on a release-please PR: version must NOT be tagged yet
#   scripts/release-preflight.sh build vX.Y.Z    # before a production build: tag must match the version
#
set -euo pipefail

MODE="${1:-pr}"
TAG="${2:-}"

fail() { printf '  \033[31mFAIL\033[0m  %s\n' "$1" >&2; FAILED=1; }
pass() { printf '  \033[32mok\033[0m    %s\n' "$1"; }
FAILED=0

echo "Release preflight (mode: $MODE)"

# 1. eas.json must be strict JSON. EAS itself tolerates JSON5, but every script
#    that reads it (including this one) uses a strict parser.
if jq -e . eas.json >/dev/null 2>&1; then
    pass "eas.json parses as strict JSON"
else
    fail "eas.json is not strict JSON (trailing comma or comment?)"
fi

# 2. package.json is the single source of truth; app.config.js must derive from
#    it. Catches anyone re-hardcoding a literal version into the Expo config.
PKG_VERSION="$(node -p "require('./package.json').version")"
EXPO_VERSION="$(npx expo config --type public --json 2>/dev/null | node -p "JSON.parse(require('fs').readFileSync(0,'utf8')).version")"

if [ "$PKG_VERSION" = "$EXPO_VERSION" ]; then
    pass "app.config.js resolves to package.json version ($PKG_VERSION)"
else
    fail "version drift: package.json=$PKG_VERSION but app.config.js resolves to $EXPO_VERSION"
fi

# 3. Build numbers come from EAS remote version source, so a literal
#    versionCode/buildNumber in the config is dead weight that will drift.
if npx expo config --type public --json 2>/dev/null | node -e "
  let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{
    const c=JSON.parse(d);
    process.exit((c.android?.versionCode==null && c.ios?.buildNumber==null) ? 0 : 1);
  })"; then
    pass "no hardcoded versionCode/buildNumber (EAS manages these remotely)"
else
    fail "app.config.js hardcodes versionCode or buildNumber; EAS appVersionSource is 'remote'"
fi

# 4. Tag agreement.
git fetch --tags --quiet 2>/dev/null || true
case "$MODE" in
    pr)
        if git rev-parse -q --verify "refs/tags/v${PKG_VERSION}" >/dev/null; then
            fail "v${PKG_VERSION} is already tagged; this release would reuse a shipped version"
        else
            pass "v${PKG_VERSION} is not yet tagged"
        fi
        ;;
    build)
        if [ -z "$TAG" ]; then
            fail "build mode requires a tag argument"
        elif [ "$TAG" != "v${PKG_VERSION}" ]; then
            fail "tag $TAG does not match package.json version ${PKG_VERSION} (expected v${PKG_VERSION})"
        else
            pass "tag $TAG matches package.json version"
        fi
        ;;
    *)
        fail "unknown mode '$MODE' (expected 'pr' or 'build')"
        ;;
esac

# 5. Expo's own project health checks.
DOCTOR_OUT="$(npx expo-doctor 2>&1)" && DOCTOR_RC=0 || DOCTOR_RC=$?
if [ "$DOCTOR_RC" -eq 0 ]; then
    pass "expo-doctor"
else
    fail "expo-doctor reported issues"
    printf '%s\n' "$DOCTOR_OUT" | sed 's/^/        /' >&2
fi

if [ "$FAILED" -ne 0 ]; then
    echo
    echo "Preflight failed." >&2
    exit 1
fi

echo
echo "All preflight checks passed for ${PKG_VERSION}."
