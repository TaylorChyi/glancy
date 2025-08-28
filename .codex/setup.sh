#!/usr/bin/env bash
set -euo pipefail

# ===== Codex setup script =====
# VERSION: v1.3.2
# CHANGELOG:
# - v1.3.2: 将 openjdk-17-jre-headless 安装与 ca-certificates-java 分事务处理；
#           对 jre 安装容忍一次性非零退出（|| true），随后统一 dpkg --configure -a 收敛；
#           在关键点重复确保 /etc/ssl/certs/java 存在，避免触发器时机不确定导致的竞态。
# - v1.3.1: 目录创建提前；显式安装 ca-certificates-java；收尾统一刷新证书。
# - v1.3.0: 初版稳定顺序。

echo "[setup] Codex Java toolchain + certificates - VERSION v1.3.2"

export DEBIAN_FRONTEND=noninteractive

# 0) 目录先就绪（即使后续被脚本清理也不报错）
install -d -m 0755 /etc/ssl/certs/java || true

# 1) 基础 CA（Certificate Authority，证书颁发机构）
apt-get update -y
apt-get install -y --no-install-recommends ca-certificates

# 2) 单独安装 JRE（Java Runtime Environment）
#    注意：极少数基础镜像会在此步“先触发 ca-certificates-java”而中断，这里容忍一次失败
apt-get install -y --no-install-recommends openjdk-17-jre-headless || true

# 3) 兜底：再确保一次目录存在，然后把半配置状态推进完成
install -d -m 0755 /etc/ssl/certs/java || true
dpkg --configure -a || true

# 4) 显式“重装” ca-certificates-java 以触发 postinst 与触发器，确保生成 /etc/ssl/certs/java/cacerts
apt-get install -y --no-install-recommends --reinstall ca-certificates-java

# 5) 安装 JDK（Java Development Kit）
apt-get install -y --no-install-recommends openjdk-17-jdk-headless

# 6) 收尾：强制刷新证书，确保一致
update-ca-certificates -f || true
dpkg --configure -a || true

java -version || true
echo "[setup] Java toolchain is ready (v1.3.2)"

# 7) 可选预热（prewarm，预先把依赖下载到本地缓存）；设为 0 可关闭
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

if [ "${PREWARM_BACKEND:-1}" = "1" ] && [ -f "$REPO_ROOT/backend/pom.xml" ]; then
  (cd "$REPO_ROOT/backend" && mvn -q -B -U dependency:go-offline || true)
fi

if [ "${PREWARM_WEBSITE:-1}" = "1" ] && [ -f "$REPO_ROOT/website/package-lock.json" ]; then
  (cd "$REPO_ROOT/website" && npm ci --prefer-offline --no-audit --fund=false || true)
fi

echo "[setup] done (v1.3.2)"