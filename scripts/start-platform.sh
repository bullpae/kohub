#!/bin/bash
# ================================================================
# K-ECP 플랫폼 통합 기동 스크립트
#
# 기동 순서: kecp-sso → KustHub → kohub
#
# 사용법:
#   ./scripts/start-platform.sh          # 전체 시작
#   ./scripts/start-platform.sh sso      # kecp-sso만 시작
#   ./scripts/start-platform.sh kusthub  # KustHub만 시작
#   ./scripts/start-platform.sh kohub    # kohub만 시작
#   ./scripts/start-platform.sh stop     # 전체 중지
#   ./scripts/start-platform.sh status   # 상태 확인
# ================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KOHUB_DIR="$(dirname "$SCRIPT_DIR")"
SSO_DIR="$KOHUB_DIR/../kecp-sso"
KUSTHUB_DIR="$KOHUB_DIR/../KustHub"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()  { echo -e "${BLUE}[INFO]${NC}  $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ---------------------------------------------------------------
# kecp-sso 시작
# ---------------------------------------------------------------
start_sso() {
    log_info "kecp-sso (Keycloak) 시작..."
    
    if [ ! -d "$SSO_DIR" ]; then
        log_error "kecp-sso 디렉토리가 없습니다: $SSO_DIR"
        return 1
    fi
    
    cd "$SSO_DIR"
    podman-compose up -d
    
    log_info "Keycloak 시작 대기 중..."
    local max_wait=120
    local waited=0
    while [ $waited -lt $max_wait ]; do
        if curl -sf http://localhost:8180/health/ready > /dev/null 2>&1; then
            log_ok "Keycloak 시작 완료 (${waited}초)"
            return 0
        fi
        sleep 5
        waited=$((waited + 5))
        echo -n "."
    done
    echo ""
    log_warn "Keycloak 시작 대기 타임아웃 (${max_wait}초). 수동으로 확인하세요."
}

# ---------------------------------------------------------------
# KustHub 시작
# ---------------------------------------------------------------
start_kusthub() {
    log_info "KustHub (고객 포탈) 시작..."
    
    if [ ! -d "$KUSTHUB_DIR" ]; then
        log_warn "KustHub 디렉토리가 없습니다: $KUSTHUB_DIR"
        return 0
    fi
    
    cd "$KUSTHUB_DIR"
    
    # .env 파일 확인
    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        cp .env.example .env
        log_info ".env 파일 생성됨 (.env.example 복사)"
    fi
    
    podman-compose up -d
    log_ok "KustHub 시작 완료"
}

# ---------------------------------------------------------------
# kohub 시작
# ---------------------------------------------------------------
start_kohub() {
    log_info "kohub (운영 플랫폼) 시작..."
    
    cd "$KOHUB_DIR"
    
    # .env 파일 확인
    if [ ! -f ".env" ] && [ -f ".env.example" ]; then
        cp .env.example .env
        log_info ".env 파일 생성됨 (.env.example 복사)"
    fi
    
    podman-compose up -d
    log_ok "kohub 시작 완료"
}

# ---------------------------------------------------------------
# 전체 중지
# ---------------------------------------------------------------
stop_all() {
    log_info "전체 서비스 중지..."
    
    if [ -d "$KOHUB_DIR" ]; then
        cd "$KOHUB_DIR"
        podman-compose down 2>/dev/null || true
        log_ok "kohub 중지"
    fi
    
    if [ -d "$KUSTHUB_DIR" ]; then
        cd "$KUSTHUB_DIR"
        podman-compose down 2>/dev/null || true
        log_ok "KustHub 중지"
    fi
    
    if [ -d "$SSO_DIR" ]; then
        cd "$SSO_DIR"
        podman-compose down 2>/dev/null || true
        log_ok "kecp-sso 중지"
    fi
    
    log_ok "전체 서비스 중지 완료"
}

# ---------------------------------------------------------------
# 상태 확인
# ---------------------------------------------------------------
show_status() {
    echo ""
    echo "=========================================="
    echo " K-ECP 플랫폼 서비스 상태"
    echo "=========================================="
    echo ""
    
    # kecp-sso
    echo "[ kecp-sso (Keycloak) ]"
    if curl -sf http://localhost:8180/health/ready > /dev/null 2>&1; then
        log_ok "Keycloak: http://localhost:8180 (정상)"
    else
        log_error "Keycloak: http://localhost:8180 (미응답)"
    fi
    echo ""
    
    # KustHub
    echo "[ KustHub (고객 포탈) ]"
    if curl -sf http://localhost:8081/actuator/health > /dev/null 2>&1; then
        log_ok "Backend:  http://localhost:8081 (정상)"
    else
        log_warn "Backend:  http://localhost:8081 (미응답)"
    fi
    if curl -sf http://localhost:4000 > /dev/null 2>&1; then
        log_ok "Frontend: http://localhost:4000 (정상)"
    else
        log_warn "Frontend: http://localhost:4000 (미응답)"
    fi
    echo ""
    
    # kohub
    echo "[ kohub (운영 플랫폼) ]"
    if curl -sf http://localhost:8082/actuator/health > /dev/null 2>&1; then
        log_ok "Backend:  http://localhost:8082 (정상)"
    else
        log_warn "Backend:  http://localhost:8082 (미응답)"
    fi
    if curl -sf http://localhost:3002 > /dev/null 2>&1; then
        log_ok "Frontend: http://localhost:3002 (정상)"
    else
        log_warn "Frontend: http://localhost:3002 (미응답)"
    fi
    echo ""
    
    echo "=========================================="
    echo " 포트 맵"
    echo "=========================================="
    echo ""
    echo "  Keycloak:          http://localhost:8180"
    echo "  KustHub Frontend:  http://localhost:4000"
    echo "  KustHub Backend:   http://localhost:8081"
    echo "  KustHub DB:        localhost:5433"
    echo "  KustHub Redis:     localhost:6379"
    echo "  kohub Frontend:    http://localhost:3002"
    echo "  kohub Backend:     http://localhost:8082"
    echo "  kohub DB:          localhost:5434"
    echo ""
}

# ---------------------------------------------------------------
# 메인 실행
# ---------------------------------------------------------------
case "${1:-all}" in
    sso)
        start_sso
        ;;
    kusthub)
        start_kusthub
        ;;
    kohub)
        start_kohub
        ;;
    stop)
        stop_all
        ;;
    status)
        show_status
        ;;
    all)
        echo ""
        echo "=========================================="
        echo " K-ECP 플랫폼 통합 기동"
        echo "=========================================="
        echo ""
        
        start_sso
        echo ""
        start_kusthub
        echo ""
        start_kohub
        echo ""
        
        show_status
        ;;
    *)
        echo "사용법: $0 {all|sso|kusthub|kohub|stop|status}"
        exit 1
        ;;
esac
