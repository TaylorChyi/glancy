#!/usr/bin/env bash
set -euo pipefail

echo "[setup] glancy - VERSION v2.2.3-prewarm-only"

# 可选：消除 mise 的 trust 警告（命令本身幂等）
if command -v mise >/dev/null 2>&1; then
  mise trust .mise.toml || true
fi

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
MVN_SETTINGS="$REPO_ROOT/.mvn/settings.xml"
MVN_LOCAL="/workspace/.m2/repository"
MVN_FLAGS="-q -B -U -DskipTests \
  -Dmaven.repo.local=$MVN_LOCAL \
  -Dmaven.wagon.http.retryHandler.count=3 \
  -Dmaven.wagon.http.retryHandler.requestSentEnabled=true \
  -Dmaven.wagon.http.timeout=30000 \
  -Dmaven.wagon.http.connectionTimeout=15000"

# backend 预热
if [ -f "$REPO_ROOT/backend/pom.xml" ] && command -v mvn >/dev/null 2>&1; then
  echo "[prewarm] backend: mvn dependency:go-offline"
  (
    cd "$REPO_ROOT/backend"
    if [ -f "$MVN_SETTINGS" ]; then
      mvn $MVN_FLAGS -s "$MVN_SETTINGS" dependency:go-offline
    else
      mvn $MVN_FLAGS dependency:go-offline
    fi
  )
else
  echo "[prewarm] backend: 跳过（未找到 pom.xml 或未检测到 mvn）"
fi

# website 预热
if [ -d "$REPO_ROOT/website" ] && command -v npm >/dev/null 2>&1; then
  echo "[prewarm] website: npm install / ci"
  (
    cd "$REPO_ROOT/website"
    if [ -f package-lock.json ]; then
      npm ci --prefer-offline --no-audit --fund=false
    else
      npm install --prefer-offline --no-audit --fund=false
    fi
  )
else
  echo "[prewarm] website: 跳过（未找到目录或未检测到 npm）"
fi

echo "[setup] done (v2.2.3)"