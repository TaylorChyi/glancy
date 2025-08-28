#!/usr/bin/env bash
set -euo pipefail

echo "[setup] java toolchain + certificates (stable order)"

export DEBIAN_FRONTEND=noninteractive

# 0) 先创建 Java 证书目录，确保后续任何触发器都能写入
install -d -m 0755 /etc/ssl/certs/java

# 1) 更新索引并安装系统 CA（Certificate Authority，证书颁发机构）
apt-get update -y
apt-get install -y --no-install-recommends ca-certificates

# 2) 一次性安装 JRE（Java Runtime Environment）、Java 证书集成包、JDK（Java Development Kit）
#    这里显式把 ca-certificates-java 列出来，避免 APT 在不可控的时机拉入
apt-get install -y --no-install-recommends \
  openjdk-17-jre-headless \
  ca-certificates-java \
  openjdk-17-jdk-headless

# 3) 收尾：把可能的“半配置状态”补齐，并强制刷新证书
dpkg --configure -a || true
update-ca-certificates -f || true

java -version
echo "[setup] java ready"

# 4) 可选预热（prewarm，预先把依赖下载到本地缓存），默认开启；设为 0 可关闭
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

if [ "${PREWARM_BACKEND:-1}" = "1" ] && [ -f "$REPO_ROOT/backend/pom.xml" ]; then
  (cd "$REPO_ROOT/backend" && mvn -q -B -U dependency:go-offline)
fi

if [ "${PREWARM_WEBSITE:-1}" = "1" ] && [ -f "$REPO_ROOT/website/package-lock.json" ]; then
  (cd "$REPO_ROOT/website" && npm ci --prefer-offline --no-audit --fund=false)
fi

echo "[setup] done"