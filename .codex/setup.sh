#!/usr/bin/env bash
set -euo pipefail

echo "[setup] java toolchain + certificates"

# 1) 基础 CA（Certificate Authority，证书颁发机构），不触发 Java 逻辑
apt-get update -y
apt-get install -y --no-install-recommends ca-certificates

# 2) 先装 JRE（Java Runtime Environment）
apt-get install -y --no-install-recommends openjdk-17-jre-headless

# 3) 在任何 Java 触发器跑之前，确保目标目录存在
install -d -m 0755 /etc/ssl/certs/java

# 4) 再装 JDK（Java Development Kit）与 Java 证书集成包
apt-get install -y --no-install-recommends openjdk-17-jdk-headless
apt-get install -y --no-install-recommends ca-certificates-java

# 5) 防守性收尾：把未完成的配置补齐，并强制刷新证书
dpkg --configure -a || true
update-ca-certificates -f || true

java -version
echo "[setup] java ready"

# 6) 可选预热（prewarm），默认开启；设为 0 可关闭
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

if [ "${PREWARM_BACKEND:-1}" = "1" ] && [ -f "$REPO_ROOT/backend/pom.xml" ]; then
  (cd "$REPO_ROOT/backend" && mvn -q -B -U dependency:go-offline)
fi

if [ "${PREWARM_WEBSITE:-1}" = "1" ] && [ -f "$REPO_ROOT/website/package-lock.json" ]; then
  (cd "$REPO_ROOT/website" && npm ci --prefer-offline --no-audit --fund=false)
fi

echo "[setup] done"