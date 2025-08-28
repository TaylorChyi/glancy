#!/usr/bin/env bash
set -euo pipefail

VERSION="v2.3.1-prewarm-only"
echo "[setup] glancy - VERSION ${VERSION}"

# 仓库根目录
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# 只做预热：后端 Maven 依赖、前端 npm 包
if [ -f "$REPO_ROOT/backend/pom.xml" ] && command -v mvn >/dev/null 2>&1; then
  echo "[prewarm] backend: mvn dependency:go-offline"
  (
    cd "$REPO_ROOT/backend"
    mvn -q -B -U -DskipTests dependency:go-offline
  )
else
  echo "[prewarm] backend: skip"
fi

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