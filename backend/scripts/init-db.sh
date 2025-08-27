#!/usr/bin/env bash
set -euo pipefail

log() { echo "[$(date '+%F %T')] $*" >&2; }

exec >>/var/log/glancy-init-db.log 2>&1
set -x

readonly DB_HOST=${DB_HOST:-localhost}
readonly DB_PORT=${DB_PORT:-3306}
readonly DB_NAME=${DB_NAME:-glancy_db}
readonly DB_USER=${DB_USER:-glancy_user}
readonly DB_PASSWORD=${DB_PASSWORD:-}

mysql_args=(-h"${DB_HOST}" -P"${DB_PORT}" -u"${DB_USER}")
if [[ -n "${DB_PASSWORD}" ]]; then
  mysql_args+=(-p"${DB_PASSWORD}")
fi

run_mysql() {
  local stderr_file
  stderr_file=$(mktemp)
  local sanitized_args=()
  for arg in "${mysql_args[@]}"; do
    if [[ $arg == -p* ]]; then
      sanitized_args+=('-p***')
    else
      sanitized_args+=("$arg")
    fi
  done
  log "Running mysql $(printf '%q ' "${sanitized_args[@]}" "$@")"
  if mysql "${mysql_args[@]}" "$@" 2>"${stderr_file}"; then
    log 'MySQL command completed successfully'
  else
    local rc=$?
    local err_msg
    err_msg=$(<"${stderr_file}")
    log "MySQL command failed with exit code ${rc}: ${err_msg}"
    rm -f "${stderr_file}"
    return "${rc}"
  fi
  rm -f "${stderr_file}"
}

log "Recreating database ${DB_NAME}"
run_mysql -e "DROP DATABASE IF EXISTS \`${DB_NAME}\`; CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
log "Loading schema into ${DB_NAME}"
run_mysql "${DB_NAME}" < "$(dirname "$0")/../schema.sql"
log 'Database initialization complete'
