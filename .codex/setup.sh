#!/usr/bin/env bash
set -euo pipefail

VERSION="v2.3.3-switch-to-central"
echo "[setup] glancy - VERSION ${VERSION}"

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# ---------- backend 预热 ----------
if [ -f "$REPO_ROOT/backend/pom.xml" ] && command -v mvn >/dev/null 2>&1; then
  echo "[prewarm] backend: mvn (with -s .mvn/settings.xml)"
  (
    cd "$REPO_ROOT/backend"

    # 禁用 maven.config 里可能残留的参数（尤其是 -s）
    if [ -f ".mvn/maven.config" ]; then
      : > .mvn/maven.config
    fi

    SETTINGS_PATH=".mvn/settings.xml"
    test -f "$SETTINGS_PATH" || { echo "FATAL: missing $SETTINGS_PATH"; exit 1; }
    printf '[prewarm] settings path: [%s]\n' "$(readlink -f "$SETTINGS_PATH" 2>/dev/null || realpath "$SETTINGS_PATH" 2>/dev/null || echo "$SETTINGS_PATH")"

    # 预热（只拉依赖与插件）
    mvn -q -B -U -DskipTests -ntp -s "$SETTINGS_PATH" dependency:go-offline
  )
else
  echo "[prewarm] backend: skip"
fi

# ---------- website 预热 ----------
if [ -d "$REPO_ROOT/website" ] && command -v npm >/dev/null 2>&1; then
  echo "[prewarm] website: npm ci/install"
  (
    cd "$REPO_ROOT/website"
    if [ -f package-lock.json ]; then
      # Try ci first; if it fails (lock mismatch/peer issues), fall back to install
      npm ci --prefer-offline --no-audit --fund=false || npm install --prefer-offline --no-audit --fund=false
    else
      npm install --prefer-offline --no-audit --fund=false
    fi
  )
else
  echo "[prewarm] website: skip"
fi

echo "[setup] done (${VERSION})"
