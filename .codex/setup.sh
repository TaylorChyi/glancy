#!/usr/bin/env bash
set -euo pipefail

echo "[setup] glancy - VERSION v2.2.1-mise trust"

mise trust .mise.toml

# 仓库根目录
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# 1) backend 预热（Maven，Apache Maven 构建工具）
if [ -f "$REPO_ROOT/backend/pom.xml" ] && command -v mvn >/dev/null 2>&1; then
  echo "[prewarm] backend: mvn dependency:go-offline"
  (
    cd "$REPO_ROOT/backend"
    # 不跑测试，只把依赖、插件、BOM（Bill of Materials，物料清单）拉到本地缓存
    mvn -q -B -U -DskipTests dependency:go-offline
  )
else
  echo "[prewarm] backend: 跳过（未找到 pom.xml 或未检测到 mvn）"
fi

# 2) website 预热（Node.js 包）
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

echo "[setup] done (v2.2.0-prewarm-only)"