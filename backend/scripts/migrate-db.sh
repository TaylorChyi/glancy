#!/usr/bin/env bash
set -euo pipefail

log() { echo "[$(date '+%F %T')] $*" >&2; }

exec >>/var/log/glancy-migrate-db.log 2>&1
set -x

readonly DB_HOST=${DB_HOST:-localhost}
readonly DB_PORT=${DB_PORT:-3306}
readonly DB_NAME=${DB_NAME:-glancy_db}
readonly DB_USER=${DB_USER:-glancy_user}
readonly DB_PASSWORD=${DB_PASSWORD:-}

mvn_args=(-f "$(dirname "$0")/../pom.xml" -q flyway:migrate \
  -Dflyway.url="jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}?createDatabaseIfNotExist=true" \
  -Dflyway.user="${DB_USER}")
if [[ -n "${DB_PASSWORD}" ]]; then
  mvn_args+=(-Dflyway.password="${DB_PASSWORD}")
fi

sanitized_args=("${mvn_args[@]}")
for i in "${!sanitized_args[@]}"; do
  [[ ${sanitized_args[i]} == -Dflyway.password=* ]] && sanitized_args[i]=-Dflyway.password=***
done

log "Applying Flyway migrations with: mvn ${sanitized_args[*]}"
mvn "${mvn_args[@]}"
log 'Database migration complete'
