#!/usr/bin/env bash
# Kiem tra port / trang thai cac microservice Electro Store (macOS / Linux).
#
# Usage:
#   ./check-all-services.sh
#   ./check-all-services.sh --minimal
#   ./check-all-services.sh --watch
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/_common.sh
source "${ROOT}/scripts/_common.sh"

MINIMAL=0
WATCH=0

for arg in "$@"; do
  case "$arg" in
    --minimal|-Minimal) MINIMAL=1 ;;
    --watch|-Watch)     WATCH=1 ;;
    -h|--help)
      echo "Usage: ./check-all-services.sh [--minimal] [--watch]"
      exit 0
      ;;
  esac
done

show_status() {
  echo ""
  c_cyan "=== Ha tang ==="
  for item in "MySQL (Docker)|3306" "Redis-auth|6379" "Redis-statistics|6380"; do
    local name="${item%%|*}" port="${item##*|}"
    if port_open "$port"; then
      c_green "  $(printf '%-28s :%-5s [UP]' "$name" "$port")"
    else
      c_red   "  $(printf '%-28s :%-5s [DOWN]' "$name" "$port")"
    fi
  done

  echo ""
  c_cyan "=== Microservices ==="
  local up=0 total=0
  while IFS='|' read -r name port ph desc runtime wait_after; do
    [[ -z "$name" ]] && continue
    if [[ "$MINIMAL" -eq 1 ]] && ! is_minimal_service "$name"; then
      continue
    fi
    total=$((total + 1))
    if port_open "$port"; then
      up=$((up + 1))
      c_green "  $(printf '%-28s :%-5s [UP]  %s' "$name" "$port" "$desc")"
    else
      c_red "  $(printf '%-28s :%-5s [DOWN] %s' "$name" "$port" "$desc")"
      [[ -f "${ROOT}/.run/${name}.log" ]] && c_gray "       -> log: .run/${name}.log"
    fi
  done < <(electro_services_tsv)

  echo ""
  if [[ "$up" -eq "$total" ]]; then
    c_green "Tong microservices: ${up} / ${total} UP"
  else
    c_yellow "Tong microservices: ${up} / ${total} UP"
    c_yellow "Goi y: ./stop.sh && ./start.sh --skip-docker"
  fi

  port_open 8761 && c_gray "Eureka UI: http://localhost:8761"
  port_open 8080 && c_gray "Gateway:   http://localhost:8080"
  port_open 5003 && c_gray "Reco docs: http://localhost:5003/docs"
  echo ""
}

if [[ "$WATCH" -eq 1 ]]; then
  while true; do
    clear || true
    c_mag "Electro Store - $(date '+%H:%M:%S')  (Ctrl+C de thoat)"
    show_status
    sleep 5
  done
else
  c_mag "Electro Store - Service Health Check"
  show_status
fi
