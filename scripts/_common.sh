#!/usr/bin/env bash
# Shared helpers for Electro Store on macOS / Linux.
# shellcheck disable=SC2034

set -euo pipefail

_electro_common_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ "${_electro_common_dir}" == */scripts ]]; then
  ELECTRO_ROOT="$(cd "${_electro_common_dir}/.." && pwd)"
else
  ELECTRO_ROOT="${_electro_common_dir}"
fi

c_cyan()  { printf '\033[36m%s\033[0m\n' "$*"; }
c_green() { printf '\033[32m%s\033[0m\n' "$*"; }
c_yellow(){ printf '\033[33m%s\033[0m\n' "$*"; }
c_red()   { printf '\033[31m%s\033[0m\n' "$*"; }
c_mag()   { printf '\033[35m%s\033[0m\n' "$*"; }
c_gray()  { printf '\033[90m%s\033[0m\n' "$*"; }

port_open() {
  local port="$1"
  if command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "$port" >/dev/null 2>&1 && return 0
    return 1
  fi
  # Bash /dev/tcp fallback
  (echo >/dev/tcp/127.0.0.1/"$port") >/dev/null 2>&1
}

wait_for_port() {
  local port="$1" label="${2:-port $1}" timeout="${3:-120}"
  local i=0
  c_gray "  Dang cho ${label}..."
  while (( i < timeout )); do
    if port_open "$port"; then
      c_green "  OK: ${label} san sang."
      return 0
    fi
    sleep 2
    i=$((i + 2))
  done
  c_red "Timeout: ${label} chua san sang sau ${timeout}s."
  return 1
}

stop_port_process() {
  local port="$1"
  local pids=""
  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  elif command -v fuser >/dev/null 2>&1; then
    fuser -k "${port}/tcp" >/dev/null 2>&1 || true
    return 0
  fi
  if [[ -n "${pids}" ]]; then
    # shellcheck disable=SC2086
    kill -9 ${pids} >/dev/null 2>&1 || true
  fi
}

import_dotenv() {
  local path="$1"
  [[ -f "$path" ]] || return 1
  # Export KEY=VALUE; skip comments / blanks; strip simple quotes
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line#"${line%%[![:space:]]*}"}"
    [[ -z "$line" || "$line" == \#* ]] && continue
    [[ "$line" != *=* ]] && continue
    local name="${line%%=*}"
    local value="${line#*=}"
    name="${name%"${name##*[![:space:]]}"}"
    value="${value#"${value%%[![:space:]]*}"}"
    if [[ "${value}" == \"*\" && "${value}" == *\" ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "${value}" == \'*\' && "${value}" == *\' ]]; then
      value="${value:1:${#value}-2}"
    fi
    export "${name}=${value}"
  done < "$path"
  return 0
}

get_maven() {
  if [[ -n "${MAVEN_CMD:-}" && -x "${MAVEN_CMD}" ]]; then
    echo "${MAVEN_CMD}"
    return
  fi
  if command -v mvn >/dev/null 2>&1; then
    command -v mvn
    return
  fi
  echo "Khong tim thay mvn trong PATH. Cai Maven 3.8+ hoac dat MAVEN_CMD." >&2
  return 1
}

get_python() {
  if command -v python3 >/dev/null 2>&1; then
    command -v python3
    return
  fi
  if command -v python >/dev/null 2>&1; then
    command -v python
    return
  fi
  echo "Can Python 3.10+ (python3)." >&2
  return 1
}

# name|port|phase|description|runtime|wait_after
electro_services_tsv() {
  cat <<'EOF'
discovery-server|8761|1|Eureka|java|0
config-server|8888|2|Config Server|java|8
auth-service|8081|3|Auth|java|0
user-service|8083|3|User + Wishlist|java|0
catalog-service|8082|3|Catalog + Inventory|java|0
cart-service|8084|3|Cart|java|0
order-service|8086|3|Order + Warranty|java|0
review-service|8087|3|Reviews|java|0
statistics-service|8088|3|Statistics + Redis|java|25
reco-service|5003|3|AI Recommendations (KNNBaseline)|python|0
chatbot-service|8092|3|Chatbot RAG + Pinecone|java|0
api-gateway|8080|4|API Gateway|java|12
EOF
}

minimal_service_names() {
  echo "discovery-server config-server auth-service user-service catalog-service api-gateway"
}

is_minimal_service() {
  local name="$1"
  [[ " $(minimal_service_names) " == *" ${name} "* ]]
}

ensure_reco_venv() {
  local module_path="$1"
  local py bin_dir python_bin pip_bin req
  py="$(get_python)"
  bin_dir="${module_path}/.venv/bin"
  python_bin="${bin_dir}/python"
  pip_bin="${bin_dir}/pip"
  req="${module_path}/requirements.txt"

  if [[ ! -x "${python_bin}" ]]; then
    c_yellow "  Tao .venv cho reco-service..."
    "${py}" -m venv "${module_path}/.venv"
  fi
  if ! "${python_bin}" -c "import uvicorn" >/dev/null 2>&1; then
    c_yellow "  Cai dependencies reco-service..."
    "${pip_bin}" install -r "${req}"
  fi
  echo "${python_bin}"
}

start_reco_service() {
  local name="$1" port="$2" run_dir="$3"
  local module_path="${ELECTRO_ROOT}/${name}"
  local log_file="${run_dir}/${name}.log"
  local pid_file="${run_dir}/${name}.pid"
  local python_bin

  [[ -f "${module_path}/main.py" ]] || { c_red "Thieu ${module_path}/main.py"; return 1; }
  if port_open "$port"; then
    c_yellow "  Bo qua ${name} - port ${port} da mo."
    return 0
  fi

  python_bin="$(ensure_reco_venv "${module_path}")"
  (
    cd "${module_path}"
    # shellcheck disable=SC1091
    [[ -f "${ELECTRO_ROOT}/.env" ]] && import_dotenv "${ELECTRO_ROOT}/.env" || true
    export AI_PORT="${port}"
    export APP_NAME="reco-service"
    export EUREKA_SERVER_URL="${EUREKA_SERVER_URL:-http://localhost:8761/eureka/}"
    exec "${python_bin}" -m uvicorn main:app --host 0.0.0.0 --port "${port}"
  ) >>"${log_file}" 2>&1 &
  echo $! >"${pid_file}"
  c_cyan "  Da khoi dong ${name} (:${port}) - log: ${log_file}"
}

start_java_service() {
  local name="$1" port="$2" run_dir="$3" maven="$4"
  local module_path="${ELECTRO_ROOT}/${name}"
  local log_file="${run_dir}/${name}.log"
  local pid_file="${run_dir}/${name}.pid"

  [[ -f "${module_path}/pom.xml" ]] || { c_red "Thieu module ${name}"; return 1; }
  if port_open "$port"; then
    c_yellow "  Bo qua ${name} - port ${port} da mo."
    return 0
  fi

  (
    cd "${module_path}"
    # shellcheck disable=SC1091
    [[ -f "${ELECTRO_ROOT}/.env" ]] && import_dotenv "${ELECTRO_ROOT}/.env" || true
    export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS:--Xms128m -Xmx384m}"
    "${maven}" clean compile -DskipTests -q
    exec "${maven}" spring-boot:run -q
  ) >>"${log_file}" 2>&1 &
  echo $! >"${pid_file}"
  c_cyan "  Da khoi dong ${name} (:${port}) - log: ${log_file}"
}

start_electro_service() {
  local name="$1" port="$2" runtime="$3" run_dir="$4" maven="$5"
  if [[ "${runtime}" == "python" ]]; then
    start_reco_service "$name" "$port" "$run_dir"
  else
    start_java_service "$name" "$port" "$run_dir" "$maven"
  fi
}

wait_for_electro_services() {
  local timeout="${1:-180}"
  shift
  local -a services=("$@")
  local deadline=$((SECONDS + timeout))
  local pending=("${services[@]}")
  c_gray "  Doi toi da ${timeout}s cho ${#services[@]} microservice..."

  while (( SECONDS < deadline )) && (( ${#pending[@]} > 0 )); do
    local -a still=()
    local item name port
    for item in "${pending[@]}"; do
      name="${item%%:*}"
      port="${item##*:}"
      if port_open "$port"; then
        c_green "  OK  ${name} (:${port})"
      else
        still+=("${item}")
      fi
    done
    pending=("${still[@]}")
    (( ${#pending[@]} == 0 )) && return 0
    sleep 3
  done

  local left
  for left in "${pending[@]}"; do
    c_red "  FAIL ${left%%:*} (:${left##*:}) - xem .run/${left%%:*}.log"
  done
  return 1
}

wait_for_gateway_ready() {
  local timeout="${1:-120}"
  if ! port_open 8080; then
    c_yellow "  SKIP Gateway readiness - port 8080 chua mo"
    return 1
  fi
  local deadline=$((SECONDS + timeout))
  local url="http://localhost:8080/api/categories/root"
  c_gray "  Doi Gateway route Eureka (toi da ${timeout}s)..."
  while (( SECONDS < deadline )); do
    local code
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$url" || echo 000)"
    if [[ "$code" == "200" ]]; then
      c_green "  OK  Gateway da route catalog (Eureka san sang)"
      return 0
    fi
    sleep 4
  done
  c_yellow "  WARN Gateway van chua 200 — doi them roi F5, hoac chay lai ./start.sh"
  return 1
}
