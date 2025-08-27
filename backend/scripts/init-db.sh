#!/usr/bin/env bash
set -euo pipefail

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
  mysql "${mysql_args[@]}" "$@"
}

run_mysql -e "DROP DATABASE IF EXISTS \`${DB_NAME}\`; CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
run_mysql "${DB_NAME}" < "$(dirname "$0")/../schema.sql"
