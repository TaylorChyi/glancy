#!/usr/bin/env bash
set -euo pipefail

log() { echo "[$(date '+%F %T')] $*" >&2; }

APP_HOME=$(cd "$(dirname "$0")/.." && pwd)

readonly DB_HOST=${DB_HOST:-localhost}
readonly DB_PORT=${DB_PORT:-3306}
readonly DB_NAME=${DB_NAME:-glancy_db}
readonly DB_USER=${DB_USER:-glancy_user}
readonly DB_PASSWORD=${DB_PASSWORD:-}

mvn_info_args=(-f "${APP_HOME}/pom.xml" -q flyway:info \
  -Dflyway.url="jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}" \
  -Dflyway.user="${DB_USER}")
if [[ -n "${DB_PASSWORD}" ]]; then
  mvn_info_args+=( -Dflyway.password="${DB_PASSWORD}" )
fi

info_output=$(mvn "${mvn_info_args[@]}")
if echo "${info_output}" | grep -q "Pending"; then
  log "数据库迁移未同步至最新版本，请先执行迁移。"
  exit 1
fi

exec java -jar "${APP_HOME}/target/glancy-backend.jar"
