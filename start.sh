#!/usr/bin/env bash
# Khoi dong toan bo microservices Electro Store tren macOS / Linux.
#
# Usage:
#   ./start.sh
#   ./start.sh --skip-docker
#   ./start.sh --skip-build
#   ./start.sh --minimal
#   ./start.sh --skip-docker --minimal
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/_common.sh
source "${ROOT}/scripts/_common.sh"

SKIP_DOCKER=0
SKIP_BUILD=0
MINIMAL=0

for arg in "$@"; do
  case "$arg" in
    --skip-docker|-SkipDocker) SKIP_DOCKER=1 ;;
    --skip-build|-SkipBuild)   SKIP_BUILD=1 ;;
    --minimal|-Minimal)        MINIMAL=1 ;;
    -h|--help)
      cat <<EOF
Usage: ./start.sh [--skip-docker] [--skip-build] [--minimal]

  --skip-docker   Bo qua docker compose / Start Redis (DB da chay san)
  --skip-build    Bo qua mvn install shared
  --minimal       Chi discovery, config, auth, user, catalog, gateway
EOF
      exit 0
      ;;
    *)
      c_red "Unknown arg: $arg"
      exit 1
      ;;
  esac
done

if [[ -f "${ROOT}/.env" ]]; then
  import_dotenv "${ROOT}/.env" && c_gray "Da nap bien moi truong tu .env"
  if [[ -n "${MYSQL_HOST:-}" && "${MYSQL_HOST}" != "localhost" && "${MYSQL_HOST}" != "127.0.0.1" && "$SKIP_DOCKER" -eq 0 ]]; then
    c_yellow "Phat hien MYSQL_HOST=${MYSQL_HOST} - goi y: ./start.sh --skip-docker"
  fi
fi

MAVEN="$(get_maven)"
RUN_DIR="${ROOT}/.run"
mkdir -p "${RUN_DIR}"

echo ""
c_mag "========================================"
c_mag "  Electro Store - START (macOS/Linux)"
c_mag "========================================"
echo "Maven: ${MAVEN}"
echo "Root:  ${ROOT}"
[[ "$MINIMAL" -eq 1 ]] && c_yellow "Che do: MINIMAL"
echo ""

# --- 1. Docker infra ---
if [[ "$SKIP_DOCKER" -eq 0 ]]; then
  c_cyan "[1/4] Ha tang Docker (MySQL) + Redis doc lap..."
  if ! command -v docker >/dev/null 2>&1; then
    c_red "Can Docker. Hoac dung: ./start.sh --skip-docker"
    exit 1
  fi
  (cd "${ROOT}" && docker compose up -d)
  wait_for_port 3306 "MySQL" 90

  if ! port_open 6379; then
    c_yellow "  Chua co redis-auth — chay scripts/start-redis.sh..."
    bash "${ROOT}/scripts/start-redis.sh"
  else
    wait_for_port 6379 "redis-auth (6379)" 30
    wait_for_port 6380 "redis-statistics (6380)" 30 || true
  fi
else
  c_gray "[1/4] Bo qua Docker (--skip-docker)."
fi

# --- 2. Build shared ---
if [[ "$SKIP_BUILD" -eq 0 ]]; then
  c_cyan "[2/4] Build shared module..."
  "${MAVEN}" -f "${ROOT}/shared/pom.xml" install -DskipTests -q
  c_green "  OK shared."
else
  c_gray "[2/4] Bo qua build shared (--skip-build)."
fi

# --- 3. Start services by phase ---
c_cyan "[3/4] Khoi dong services..."
declare -a WAIT_LIST=()

for phase in 1 2 3 4; do
  c_cyan "  --- Phase ${phase} ---"
  while IFS='|' read -r name port ph desc runtime wait_after; do
    [[ -z "$name" ]] && continue
    [[ "$ph" != "$phase" ]] && continue
    if [[ "$MINIMAL" -eq 1 ]] && ! is_minimal_service "$name"; then
      continue
    fi
    start_electro_service "$name" "$port" "$runtime" "${RUN_DIR}" "${MAVEN}"
    WAIT_LIST+=("${name}:${port}")
    if [[ "${wait_after}" -gt 0 ]]; then
      sleep "${wait_after}"
    elif [[ "$phase" -eq 3 ]]; then
      sleep 5
    fi
  done < <(electro_services_tsv)
  if [[ "$phase" -lt 4 ]]; then
    sleep 3
  fi
done

# --- 4. Wait ports ---
c_cyan "[4/5] Cho cac service san sang (mo port)..."
ALL_READY=0
if wait_for_electro_services 180 "${WAIT_LIST[@]}"; then
  ALL_READY=1
fi

if [[ "$ALL_READY" -eq 1 ]]; then
  c_cyan "[5/5] Kiem tra Gateway route qua Eureka..."
  wait_for_gateway_ready 120 || true
fi

echo ""
if [[ "$ALL_READY" -eq 1 ]]; then
  c_green "========================================"
  c_green "  Tat ca service da san sang!"
  c_green "========================================"
else
  c_yellow "========================================"
  c_yellow "  Mot so service CHUA len port!"
  c_yellow "========================================"
  c_gray "  Goi y: doi 30-60s roi chay ./check-all-services.sh"
  c_gray "  Log: .run/<ten-service>.log"
  c_gray "  Restart: ./stop.sh && ./start.sh --skip-docker"
fi

echo "  API Gateway:  http://localhost:8080"
echo "  Eureka:       http://localhost:8761"
echo "  Reco (AI):    http://localhost:5003/docs"
echo "  Log files:    .run/*.log"
echo ""
c_yellow "Kiem tra:  ./check-all-services.sh"
c_yellow "Dung:      ./stop.sh"
echo ""
