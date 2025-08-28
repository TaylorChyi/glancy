#!/usr/bin/env bash
set -euo pipefail

echo "[setup] installing JRE/JDK and preparing certificate paths"

# 进入仓库根（容器里通常已经在根，但保险处理）
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

# 0) 仅装系统 CA（Certificate Authority，证书颁发机构），不会触发 Java 步骤
apt-get update -y
apt-get install -y --no-install-recommends ca-certificates

# 1) 先装 JRE（Java Runtime Environment）
#    这样后续任何与 Java 证书相关的触发器都有完整的 JAVA_HOME 与可执行文件
apt-get install -y --no-install-recommends openjdk-17-jre-headless

# 2) 确保 Java 证书目录存在（关键：在 ca-certificates-java 触发器运行之前创建）
install -d -m 0755 /etc/ssl/certs/java

# 3) 再装 JDK（Java Development Kit），以及 Java 证书集成包
#    拆成两步可读性更强；如果你只需要 JRE，也可以不装 JDK
apt-get install -y --no-install-recommends openjdk-17-jdk-headless
apt-get install -y --no-install-recommends ca-certificates-java

# 4) 强制刷新系统证书与 Java 证书，并完成所有未完成的配置
update-ca-certificates -f || true
dpkg --configure -a || true

java -version
echo "[setup] java toolchain and certificates ready"

# 5) 可选：预热（prewarm）依赖，默认开启；设为 0 可关闭
if [ "${PREWARM_BACKEND:-1}" = "1" ] && [ -f "$REPO_ROOT/backend/pom.xml" ]; then
  (cd "$REPO_ROOT/backend" && mvn -q -B -U dependency:go-offline)
fi

if [ "${PREWARM_WEBSITE:-1}" = "1" ] && [ -f "$REPO_ROOT/website/package-lock.json" ]; then
  (cd "$REPO_ROOT/website" && npm ci --prefer-offline --no-audit --fund=false)
fi

echo "[setup] done"