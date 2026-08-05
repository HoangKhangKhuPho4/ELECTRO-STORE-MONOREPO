#!/usr/bin/env bash
# Dung microservices Electro Store tren macOS / Linux.
#
# Usage:
#   ./stop.sh
#   ./stop.sh --keep-infra    # chi dung Java/Python, giu MySQL+Redis
#   ./stop.sh --minimal
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/_common.sh
source "${ROOT}/scripts/_common.sh"

KEEP_INFRA=0
MINIMAL=0

for arg in "$@"; do
  case "$arg" in
    --keep-infra|-KeepInfra) KEEP_INFRA=1 ;;
    --minimal|-Minimal)      MINIMAL=1 ;;
    -h|--help)
      echo "Usage: ./stop.sh [--keep-infra] [--minimal]"
      exit 0
      ;;
  esac
done

c_yellow "Dang dung microservices..."

# Stop by descending port (gateway first is fine either way)
while IFS='|' read -r name port ph desc runtime wait_after; do
  [[ -z "$name" ]] && continue
  if [[ "$MINIMAL" -eq 1 ]] && ! is_minimal_service "$name"; then
    continue
  fi
  if port_open "$port"; then
    stop_port_process "$port"
    c_gray "  Da giai phong port ${port} (${name})"
  fi
  pid_file="${ROOT}/.run/${name}.pid"
  if [[ -f "$pid_file" ]]; then
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "${pid}" ]] && kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" >/dev/null 2>&1 || true
    fi
    rm -f "$pid_file"
  fi
done < <(electro_services_tsv | sort -t'|' -k2 -nr)

if [[ "$KEEP_INFRA" -eq 0 ]]; then
  c_yellow "Dang dung Docker Compose (MySQL)..."
  if command -v docker >/dev/null 2>&1; then
    (cd "${ROOT}" && docker compose down) || true
  fi
  if [[ -x "${ROOT}/scripts/start-redis.sh" ]] || [[ -f "${ROOT}/scripts/start-redis.sh" ]]; then
    bash "${ROOT}/scripts/start-redis.sh" --down || true
  fi
  c_green "Da dung ha tang (compose + redis containers)."
else
  c_gray "Giu MySQL + Redis (--keep-infra)."
fi

echo ""
c_cyan "Hoan tat. Kiem tra: ./check-all-services.sh"
