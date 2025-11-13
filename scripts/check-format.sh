#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"

echo "[format] Running Spotless check to ensure Java sources match .editorconfig rules..."
(
  cd "${BACKEND_DIR}"
  ./mvnw spotless:check
)

echo "[format] Spotless check finished. Run ./backend/mvnw spotless:apply if fixes are required."
