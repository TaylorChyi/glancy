#!/usr/bin/env bash
set -euo pipefail

echo "[setup] install JDK (Java Development Kit) and prepare certificates"

# 进入仓库根；Codex 会在仓库根执行，但这里保险处理
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

# 修复上次失败的根因：确保 Java 证书目录存在，避免 ca-certificates-java 写入时报错
mkdir -p /etc/ssl/certs/java || true

# 安装 JDK（最小依赖集）
apt-get update -y
apt-get install -y --no-install-recommends ca-certificates openjdk-17-jdk-headless
update-ca-certificates -f || true
dpkg --configure -a || true
java -version

# 可选预热：第一次把依赖全拉齐，后续构建更稳更快
# 预热后端（Maven 依赖与插件的完整解析与下载）
if [ "${PREWARM_BACKEND:-1}" = "1" ] && [ -f "$REPO_ROOT/backend/pom.xml" ]; then
  (cd "$REPO_ROOT/backend" && mvn -q -B -U dependency:go-offline)
fi

# 可选预热前端（按锁文件安装）
if [ "${PREWARM_WEBSITE:-1}" = "1" ] && [ -f "$REPO_ROOT/website/package-lock.json" ]; then
  (cd "$REPO_ROOT/website" && npm ci --prefer-offline --no-audit --fund=false)
fi

echo "[setup] done"