#!/usr/bin/env bash
# Import schema microservice vao MySQL (macOS / Linux).
#
# Usage:
#   ./scripts/import-databases.sh
#   ./scripts/import-databases.sh --host 127.0.0.1 --port 3306 --user root --password root
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA_DIR="${ROOT}/database/schemas"

HOST="127.0.0.1"
PORT="3306"
USER="root"
PASSWORD=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) HOST="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --user) USER="$2"; shift 2 ;;
    --password) PASSWORD="$2"; shift 2 ;;
    *) echo "Unknown: $1"; exit 1 ;;
  esac
done

if [[ ! -d "$SCHEMA_DIR" ]]; then
  echo "Chua co database/schemas." >&2
  exit 1
fi

if ! command -v mysql >/dev/null 2>&1; then
  echo "Can mysql client trong PATH (brew install mysql-client / apt install mysql-client)." >&2
  exit 1
fi

mysql_cmd=(mysql -h "$HOST" -P "$PORT" -u "$USER")
if [[ -n "$PASSWORD" ]]; then
  mysql_cmd+=(-p"$PASSWORD")
fi

echo "Import databases -> ${HOST}:${PORT}"
shopt -s nullglob
files=("${SCHEMA_DIR}"/electro_*_db "${SCHEMA_DIR}"/electro_*_db.sql)
if [[ ${#files[@]} -eq 0 ]]; then
  echo "Khong tim thay dump electro_*_db trong ${SCHEMA_DIR}" >&2
  exit 1
fi

for f in "${files[@]}"; do
  base="$(basename "$f")"
  db="${base%.sql}"
  echo "  -> ${db}"
  "${mysql_cmd[@]}" -e "CREATE DATABASE IF NOT EXISTS \`${db}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  "${mysql_cmd[@]}" "$db" < "$f"
done

echo "Import xong."
"${mysql_cmd[@]}" -e "SHOW DATABASES LIKE 'electro_%';"
