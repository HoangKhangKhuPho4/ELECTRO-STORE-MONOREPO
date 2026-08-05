#!/usr/bin/env bash
# Tao 2 container Redis DOC LAP (macOS / Linux / Docker):
#   redis-auth        -> localhost:6379
#   redis-statistics  -> localhost:6380
#
# Usage:
#   ./scripts/start-redis.sh
#   ./scripts/start-redis.sh --down
#
set -euo pipefail

DOWN=0
for arg in "$@"; do
  case "$arg" in
    --down|-Down) DOWN=1 ;;
  esac
done

if ! command -v docker >/dev/null 2>&1; then
  echo "Khong tim thay docker. Cai Docker Desktop (Mac) hoac Docker Engine (Linux)." >&2
  exit 1
fi

if [[ "$DOWN" -eq 1 ]]; then
  echo "Dang dung / xoa redis-auth + redis-statistics..."
  docker rm -f redis-auth redis-statistics >/dev/null 2>&1 || true
  echo "Da xoa 2 container."
  exit 0
fi

echo "Tao lai 2 container Redis doc lap..."
docker rm -f redis-auth redis-statistics >/dev/null 2>&1 || true
docker volume create redis-auth-data >/dev/null
docker volume create redis-statistics-data >/dev/null

docker run -d \
  --name redis-auth \
  -p 6379:6379 \
  -v redis-auth-data:/data \
  --restart unless-stopped \
  redis:7-alpine redis-server --appendonly yes

docker run -d \
  --name redis-statistics \
  -p 6380:6379 \
  -v redis-statistics-data:/data \
  --restart unless-stopped \
  redis:7-alpine redis-server --appendonly yes

sleep 2
echo ""
echo "OK — Redis:"
echo "  redis-auth        -> localhost:6379"
echo "  redis-statistics  -> localhost:6380"
docker ps --filter "name=redis-" --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"
