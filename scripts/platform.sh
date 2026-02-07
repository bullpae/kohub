#!/bin/bash
# ================================================================
# K-ECP 통합 플랫폼 관리 스크립트
#
# 사용법:
#   ./scripts/platform.sh start        전체 시작
#   ./scripts/platform.sh stop         전체 중지
#   ./scripts/platform.sh restart      전체 재시작
#   ./scripts/platform.sh status       상태 확인
#   ./scripts/platform.sh health       헬스체크
#   ./scripts/platform.sh logs [서비스] 로그 확인
#   ./scripts/platform.sh update [서비스] 개별 서비스 업데이트 (무중단)
#   ./scripts/platform.sh backup       DB 백업
#   ./scripts/platform.sh rollback     이전 버전 롤백
#   ./scripts/platform.sh build        전체 빌드
# ================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/compose.platform.yml"
ENV_FILE="$PROJECT_DIR/.env.platform"
BACKUP_DIR="$PROJECT_DIR/backups"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'
BOLD='\033[1m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[  OK]${NC}  $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ ERR]${NC}  $1"; }
log_title() { echo -e "\n${BOLD}${CYAN}═══ $1 ═══${NC}\n"; }

# Compose 명령 (podman-compose 또는 docker compose)
COMPOSE_CMD=""
detect_compose() {
    if command -v podman-compose &>/dev/null; then
        COMPOSE_CMD="podman-compose"
    elif command -v docker &>/dev/null && docker compose version &>/dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &>/dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        log_error "podman-compose 또는 docker compose가 필요합니다."
        exit 1
    fi
    log_info "컨테이너 엔진: $COMPOSE_CMD"
}

compose() {
    local env_opt=""
    if [ -f "$ENV_FILE" ]; then
        env_opt="--env-file $ENV_FILE"
    fi
    $COMPOSE_CMD -f "$COMPOSE_FILE" $env_opt "$@"
}

# ---------------------------------------------------------------
# 시작
# ---------------------------------------------------------------
cmd_start() {
    log_title "K-ECP 플랫폼 시작"

    # .env 파일 확인
    if [ ! -f "$ENV_FILE" ]; then
        log_warn ".env.platform 파일이 없습니다. 기본값으로 시작합니다."
        log_info "cp .env.platform.example .env.platform 으로 생성하세요."
    fi

    # SSL 디렉토리 생성
    mkdir -p "$PROJECT_DIR/nginx/ssl"
    # 자체 서명 인증서가 없으면 더미 생성
    if [ ! -f "$PROJECT_DIR/nginx/ssl/fullchain.pem" ]; then
        log_info "SSL 인증서 없음 (HTTP 모드로 시작)"
    fi

    log_info "인프라 계층 시작 (PostgreSQL, Redis)..."
    compose up -d postgres redis
    sleep 5

    log_info "인증 계층 시작 (Keycloak)..."
    compose up -d keycloak
    
    log_info "Keycloak 시작 대기..."
    local waited=0
    while [ $waited -lt 120 ]; do
        if compose exec keycloak sh -c "wget -qO- http://localhost:8080/auth/health/ready" &>/dev/null; then
            log_ok "Keycloak 준비 완료 (${waited}초)"
            break
        fi
        sleep 5
        waited=$((waited + 5))
        echo -n "."
    done
    echo ""

    log_info "애플리케이션 계층 시작..."
    compose up -d kohub-backend kusthub-backend
    sleep 10

    log_info "프론트엔드 시작..."
    compose up -d kohub-frontend kusthub-frontend

    log_info "운영 도구 시작 (Uptime Kuma, Termix)..."
    compose up -d uptime-kuma termix

    log_info "게이트웨이 시작 (Nginx)..."
    compose up -d nginx

    sleep 5
    cmd_health
}

# ---------------------------------------------------------------
# 중지
# ---------------------------------------------------------------
cmd_stop() {
    log_title "K-ECP 플랫폼 중지"
    compose down
    log_ok "전체 서비스 중지 완료"
}

# ---------------------------------------------------------------
# 재시작
# ---------------------------------------------------------------
cmd_restart() {
    cmd_stop
    cmd_start
}

# ---------------------------------------------------------------
# 상태 확인
# ---------------------------------------------------------------
cmd_status() {
    log_title "K-ECP 플랫폼 서비스 상태"
    compose ps
}

# ---------------------------------------------------------------
# 헬스체크
# ---------------------------------------------------------------
cmd_health() {
    log_title "K-ECP 플랫폼 헬스체크"
    
    local base_url="${BASE_URL:-http://localhost}"
    local all_ok=true

    check_health() {
        local name=$1 url=$2
        local status
        status=$(curl -sf -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        if [ "$status" = "200" ]; then
            log_ok "$name: $url (HTTP $status)"
        else
            log_error "$name: $url (HTTP $status)"
            all_ok=false
        fi
    }

    check_health "Nginx (Gateway)"     "$base_url/health"
    check_health "kohub Backend"       "$base_url/actuator/health"
    check_health "kohub Frontend"      "$base_url/"
    check_health "KustHub Backend"     "$base_url/support/actuator/health"
    check_health "KustHub Frontend"    "$base_url/support/"
    check_health "Keycloak"            "$base_url/auth/health/ready"
    check_health "Uptime Kuma"         "$base_url/monitor/"
    check_health "Termix"              "$base_url/terminal/"

    echo ""
    if $all_ok; then
        log_ok "모든 서비스 정상"
    else
        log_warn "일부 서비스에 문제가 있습니다."
    fi

    echo ""
    echo "  접속 URL: $base_url"
    echo "  ├── /              kohub (MSP 운영 센터)"
    echo "  ├── /support/      KustHub (고객 포탈)"
    echo "  ├── /auth/         Keycloak (SSO)"
    echo "  ├── /monitor/      Uptime Kuma (모니터링)"
    echo "  └── /terminal/     Termix (SSH 터미널)"
    echo ""
}

# ---------------------------------------------------------------
# 로그
# ---------------------------------------------------------------
cmd_logs() {
    local service=${1:-}
    if [ -n "$service" ]; then
        compose logs -f --tail=100 "$service"
    else
        compose logs -f --tail=50
    fi
}

# ---------------------------------------------------------------
# 개별 서비스 업데이트 (무중단)
# ---------------------------------------------------------------
cmd_update() {
    local service=$1
    if [ -z "$service" ]; then
        log_error "서비스 이름을 지정하세요."
        echo "  사용법: $0 update <서비스>"
        echo "  서비스: kohub-backend, kohub-frontend, kusthub-backend, kusthub-frontend"
        exit 1
    fi

    log_title "$service 업데이트 (무중단)"

    # 이미지 백업
    local image_name
    image_name=$(compose images "$service" 2>/dev/null | tail -1 | awk '{print $2}')
    if [ -n "$image_name" ]; then
        log_info "현재 이미지 백업: ${image_name}:backup"
        podman tag "$image_name:latest" "$image_name:backup" 2>/dev/null || true
    fi

    log_info "이미지 재빌드..."
    compose build --no-cache "$service"

    log_info "서비스 재시작..."
    compose up -d --no-deps "$service"

    log_info "헬스체크 대기 (30초)..."
    sleep 30

    log_ok "$service 업데이트 완료"
}

# ---------------------------------------------------------------
# 백업
# ---------------------------------------------------------------
cmd_backup() {
    log_title "K-ECP 플랫폼 백업"

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/$timestamp"
    mkdir -p "$backup_path"

    # PostgreSQL 전체 백업
    log_info "PostgreSQL 백업..."
    compose exec -T postgres pg_dumpall -U "${POSTGRES_ADMIN_USER:-kecp_admin}" \
        | gzip > "$backup_path/postgres_all_${timestamp}.sql.gz"
    log_ok "PostgreSQL 백업 완료: $backup_path/postgres_all_${timestamp}.sql.gz"

    # 개별 DB 백업
    for db in keycloak kusthub kohub; do
        compose exec -T postgres pg_dump -U "${POSTGRES_ADMIN_USER:-kecp_admin}" "$db" \
            | gzip > "$backup_path/${db}_${timestamp}.sql.gz"
        log_ok "  $db DB 백업 완료"
    done

    # 백업 크기 표시
    local size
    size=$(du -sh "$backup_path" | cut -f1)
    log_ok "백업 완료: $backup_path ($size)"

    # 오래된 백업 정리 (30일 이상)
    find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +30 -exec rm -rf {} \; 2>/dev/null || true
    log_info "30일 이상 백업 정리 완료"
}

# ---------------------------------------------------------------
# 롤백
# ---------------------------------------------------------------
cmd_rollback() {
    log_title "K-ECP 플랫폼 롤백"

    log_warn "이전 버전으로 롤백합니다. 계속하시겠습니까? (y/N)"
    read -r answer
    if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
        log_info "롤백 취소"
        exit 0
    fi

    # 백업 이미지로 복원
    for service in kohub-backend kohub-frontend kusthub-backend kusthub-frontend; do
        if podman image exists "${service}:backup" 2>/dev/null; then
            log_info "$service 롤백..."
            podman tag "${service}:backup" "${service}:latest"
            compose up -d --no-deps "$service"
        else
            log_warn "$service 백업 이미지 없음 (스킵)"
        fi
    done

    sleep 15
    cmd_health
}

# ---------------------------------------------------------------
# 빌드
# ---------------------------------------------------------------
cmd_build() {
    log_title "K-ECP 플랫폼 빌드"
    compose build
    log_ok "전체 빌드 완료"
}

# ---------------------------------------------------------------
# 메인 실행
# ---------------------------------------------------------------
detect_compose

case "${1:-help}" in
    start)    cmd_start ;;
    stop)     cmd_stop ;;
    restart)  cmd_restart ;;
    status)   cmd_status ;;
    health)   cmd_health ;;
    logs)     cmd_logs "$2" ;;
    update)   cmd_update "$2" ;;
    backup)   cmd_backup ;;
    rollback) cmd_rollback ;;
    build)    cmd_build ;;
    *)
        echo ""
        echo "K-ECP 통합 플랫폼 관리"
        echo ""
        echo "사용법: $0 <명령>"
        echo ""
        echo "  start           전체 플랫폼 시작"
        echo "  stop            전체 플랫폼 중지"
        echo "  restart         전체 재시작"
        echo "  status          서비스 상태 확인"
        echo "  health          헬스체크 실행"
        echo "  logs [서비스]    로그 확인"
        echo "  update <서비스>  개별 서비스 무중단 업데이트"
        echo "  backup          DB 백업"
        echo "  rollback        이전 버전 롤백"
        echo "  build           전체 이미지 빌드"
        echo ""
        ;;
esac
