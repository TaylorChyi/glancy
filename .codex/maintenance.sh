#!/usr/bin/env bash
set -euo pipefail

echo "[maintenance] align backend and website dependencies"

# 后端：把缺失的 Maven 依赖与插件补齐到本地缓存
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)/backend"
mvn -q -B -U dependency:go-offline

# 前端：严格按锁文件安装（若锁文件未变会命中缓存，速度很快）
cd ../website
# Normalize npm proxy env to supported keys to avoid: "Unknown env config 'http-proxy'"
if [ -z "${npm_config_proxy:-}" ]; then
  if [ -n "${npm_config_http_proxy:-}" ]; then export npm_config_proxy="${npm_config_http_proxy}"; fi
  if [ -z "${npm_config_proxy:-}" ] && [ -n "${HTTP_PROXY:-}" ]; then export npm_config_proxy="${HTTP_PROXY}"; fi
  if [ -z "${npm_config_proxy:-}" ] && [ -n "${http_proxy:-}" ]; then export npm_config_proxy="${http_proxy}"; fi
fi
if [ -n "${npm_config_http_proxy:-}" ]; then unset npm_config_http_proxy; fi
if [ -z "${npm_config_https_proxy:-}" ]; then
  if [ -n "${HTTPS_PROXY:-}" ]; then export npm_config_https_proxy="${HTTPS_PROXY}"; fi
  if [ -z "${npm_config_https_proxy:-}" ] && [ -n "${https_proxy:-}" ]; then export npm_config_https_proxy="${https_proxy}"; fi
  if [ -z "${npm_config_https_proxy:-}" ] && [ -n "${npm_config_proxy:-}" ]; then export npm_config_https_proxy="${npm_config_proxy}"; fi
fi
if [ -n "${NO_PROXY:-}" ] && [ -z "${npm_config_noproxy:-}" ]; then export npm_config_noproxy="${NO_PROXY}"; fi
if [ -n "${no_proxy:-}" ] && [ -z "${npm_config_noproxy:-}" ]; then export npm_config_noproxy="${no_proxy}"; fi
npm ci --prefer-offline --no-audit --fund=false

echo "[maintenance] done"
