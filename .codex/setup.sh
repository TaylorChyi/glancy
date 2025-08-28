#!/usr/bin/env bash
set -euo pipefail
echo "[setup] glancy - VERSION v2.3.0-ipv4-only-prewarm"

# 信任 mise（可有可无，不影响 Maven 出网）
mise trust .mise.toml || true

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

if [ -f "$REPO_ROOT/backend/pom.xml" ] && command -v mvn >/dev/null 2>&1; then
  echo "[prewarm] backend: mvn dependency:go-offline"
  (
    cd "$REPO_ROOT/backend"
    # .mvn/jvm.config & .mvn/maven.config 已生效，这里无需再拼 -s / JVM 选项
    mvn -q -B -U -DskipTests dependency:go-offline
  )
else
  echo "[prewarm] backend: skip (no mvn or pom.xml)"
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

echo "[setup] done (v2.3.0)"w