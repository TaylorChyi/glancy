#!/usr/bin/env bash
set -euo pipefail

echo "[maintenance] align backend and website dependencies"

# 后端：使用与 setup 一致的 settings 进行 go-offline；若网络不可达则跳过但不失败
(
  cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)/backend"
  SETTINGS_PATH=".mvn/settings.xml"
  if [ -f "$SETTINGS_PATH" ]; then
    mvn -q -B -U -ntp -DskipTests -s "$SETTINGS_PATH" dependency:go-offline \
      || echo "[maintenance] backend: go-offline skipped (network/cache unavailable)"
  else
    mvn -q -B -U -ntp -DskipTests dependency:go-offline \
      || echo "[maintenance] backend: go-offline skipped (no settings)"
  fi
)

# 前端：优先 ci，必要时回退 install（与 setup 保持一致）
(
  cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)/website"
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
  if [ -f package-lock.json ]; then
    npm ci --prefer-offline --no-audit --fund=false || npm install --prefer-offline --no-audit --fund=false
  else
    npm install --prefer-offline --no-audit --fund=false
  fi
)

echo "[maintenance] done"
