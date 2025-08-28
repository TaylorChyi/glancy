#!/usr/bin/env bash
set -euo pipefail

echo "[maintenance] align backend and website dependencies"

# 后端：把缺失的 Maven 依赖与插件补齐到本地缓存
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)/backend"
mvn -q -B -U dependency:go-offline

# 前端：严格按锁文件安装（若锁文件未变会命中缓存，速度很快）
cd ../website
npm ci --prefer-offline --no-audit --fund=false

echo "[maintenance] done"