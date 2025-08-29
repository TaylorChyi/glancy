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
    # Normalize npm proxy env to supported keys to avoid: "Unknown env config 'http-proxy'"
    if [ -z "${npm_config_proxy:-}" ]; then
      if [ -n "${npm_config_http_proxy:-}" ]; then export npm_config_proxy="${npm_config_http_proxy}"; fi
      if [ -z "${npm_config_proxy:-}" ] && [ -n "${HTTP_PROXY:-}" ]; then export npm_config_proxy="${HTTP_PROXY}"; fi
      if [ -z "${npm_config_proxy:-}" ] && [ -n "${http_proxy:-}" ]; then export npm_config_proxy="${http_proxy}"; fi
    fi
    # Drop deprecated env key to silence npm warning
    if [ -n "${npm_config_http_proxy:-}" ]; then unset npm_config_http_proxy; fi
    if [ -z "${npm_config_https_proxy:-}" ]; then
      if [ -n "${HTTPS_PROXY:-}" ]; then export npm_config_https_proxy="${HTTPS_PROXY}"; fi
      if [ -z "${npm_config_https_proxy:-}" ] && [ -n "${https_proxy:-}" ]; then export npm_config_https_proxy="${https_proxy}"; fi
      if [ -z "${npm_config_https_proxy:-}" ] && [ -n "${npm_config_proxy:-}" ]; then export npm_config_https_proxy="${npm_config_proxy}"; fi
    fi
    if [ -n "${NO_PROXY:-}" ] && [ -z "${npm_config_noproxy:-}" ]; then export npm_config_noproxy="${NO_PROXY}"; fi
    if [ -n "${no_proxy:-}" ] && [ -z "${npm_config_noproxy:-}" ]; then export npm_config_noproxy="${no_proxy}"; fi
    if [ -f package-lock.json ]; then
      # Detect lockfile sync with package.json to avoid noisy npm ci failure
      if node -e '
        const fs=require("fs");
        const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));
        const lock=JSON.parse(fs.readFileSync("package-lock.json","utf8"));
        const want={...pkg.dependencies,...pkg.devDependencies};
        const root=(lock.packages&&lock.packages[""])||{};
        const have={...(root.dependencies||{}),...(root.devDependencies||{})};
        const keys=new Set([...Object.keys(want),...Object.keys(have)]);
        let mismatch=false;
        for (const k of keys){ if(!want[k]||!have[k]||want[k]!==have[k]){ mismatch=true; break; } }
        process.exit(mismatch?1:0);
      '; then
        npm ci --prefer-offline --no-audit --fund=false
      else
        echo "[prewarm] website: lock out of sync → npm install"
        npm install --prefer-offline --no-audit --fund=false
      fi
    else
      npm install --prefer-offline --no-audit --fund=false
    fi
  )
else
  echo "[prewarm] website: skip"
fi

echo "[setup] done (${VERSION})"
