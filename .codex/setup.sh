#!/usr/bin/env bash
set -euo pipefail

VERSION="v2.3.2-cli-settings-hotfix"
echo "[setup] glancy - VERSION ${VERSION}"

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# ---------- backend 预热 ----------
if [ -f "$REPO_ROOT/backend/pom.xml" ] && command -v mvn >/dev/null 2>&1; then
  echo "[prewarm] backend: mvn (with -s .mvn/settings.xml)"
  (
    cd "$REPO_ROOT/backend"

    # 强制不用 maven.config 里的 -s，避免隐形空格；若存在则先备份并置空
    if [ -f ".mvn/maven.config" ]; then
      cp .mvn/maven.config .mvn/maven.config.bak || true
      : > .mvn/maven.config
    fi

    # 绝对路径打印，便于确认没有前导空格
    SETTINGS_PATH=".mvn/settings.xml"
    test -f "$SETTINGS_PATH" || { echo "FATAL: missing $SETTINGS_PATH"; exit 1; }
    printf '[prewarm] settings path: [%s]\n' "$(readlink -f "$SETTINGS_PATH" 2>/dev/null || realpath "$SETTINGS_PATH" 2>/dev/null || echo "$SETTINGS_PATH")"

    # 显式传 -s
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
      npm ci --prefer-offline --no-audit --fund=false
    else
      npm install --prefer-offline --no-audit --fund=false
    fi
  )
else
  echo "[prewarm] website: skip"
fi

echo "[setup] done (${VERSION})"