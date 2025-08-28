#!/usr/bin/env bash
set -euo pipefail

# ===== Codex setup (mise-based) =====
# VERSION: v2.0.0-mise
# CHANGELOG:
# - v2.0.0-mise: 改用 mise 安装 Java（Eclipse Temurin 17）与 Maven，彻底绕开 apt 的 ca-certificates-java 触发器问题。
#                读取 .mise.toml 固定版本；预热 backend 与 website 依赖；打印版本以便校验。

echo "[setup] glancy toolchain via mise - VERSION v2.0.0-mise"

# 0) 若之前有未完成的 dpkg（Debian Package 管理器）状态，尽量收敛一下（幂等）
dpkg --configure -a || true

# 1) 激活 mise（多语言运行时管理器）
#    Codex 默认装了 mise，这里让当前 shell 获取 PATH
if command -v mise >/dev/null 2>&1; then
  eval "$(mise activate bash)"
else
  echo "[setup] ERROR: mise not found" >&2
  exit 1
fi

# 2) 确保 java/maven/node 插件可用（幂等）
mise plugins install java  || true
mise plugins install maven || true
mise plugins install node  || true

# 3) 安装并启用 .mise.toml 指定的工具版本（按仓库约束）
#    - 先 install，再 run（避免第一次 use 慢导致后续命令找不到）
mise install
mise run true || true

# 4) 打印工具链版本，便于诊断
echo "[setup] versions:"
java -version || true
mvn  -version || true
node -v       || true
npm  -v       || true

# 5) 预热依赖（prewarm：提前把需要的依赖下载进缓存）
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

if [ -f "$REPO_ROOT/backend/pom.xml" ]; then
  echo "[setup] prewarm backend maven deps"
  # 先更新快照/元数据，再离线预抓
  (cd "$REPO_ROOT/backend" && mvn -q -B -U dependency:go-offline || true)
fi

if [ -f "$REPO_ROOT/website/package-lock.json" ] || [ -f "$REPO_ROOT/website/pnpm-lock.yaml" ] || [ -f "$REPO_ROOT/website/yarn.lock" ]; then
  echo "[setup] prewarm website node deps"
  (cd "$REPO_ROOT/website" && npm ci --prefer-offline --no-audit --fund=false || true)
fi

echo "[setup] done (v2.0.0-mise)"
