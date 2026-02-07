#!/bin/bash
# ================================
# kohub 개발 환경 시작 스크립트
# 
# 사용법:
#   ./scripts/start-dev.sh         # 기본 (SSO 활성화)
#   ./scripts/start-dev.sh --no-sso # SSO 비활성화
#
# 전체 플랫폼 기동은 start-platform.sh 참조
# ================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SSO_DIR="$PROJECT_DIR/../kecp-sso"

SSO_MODE="true"
if [ "$1" = "--no-sso" ]; then
    SSO_MODE="false"
fi

echo "========================================"
echo " kohub 개발 환경 시작"
echo " SSO: $SSO_MODE"
echo "========================================"
echo ""

# 1. kecp-sso 확인 및 시작
if [ "$SSO_MODE" = "true" ] && [ -d "$SSO_DIR" ]; then
    echo "[INFO] kecp-sso 네트워크 확인..."
    
    if ! podman network exists kecp-sso_kecp-sso-network 2>/dev/null; then
        echo "[INFO] kecp-sso 서비스 시작 중..."
        cd "$SSO_DIR"
        podman-compose up -d
        echo "[INFO] Keycloak 시작 대기 (30초)..."
        sleep 30
        cd "$PROJECT_DIR"
    else
        echo "[OK]   kecp-sso 네트워크 존재"
    fi
elif [ "$SSO_MODE" = "true" ]; then
    echo "[WARN] kecp-sso 디렉토리가 없습니다: $SSO_DIR"
    echo "       SSO 없이 개발 모드로 실행합니다."
    SSO_MODE="false"
fi

# 2. kohub 서비스 시작
echo ""
echo "[INFO] kohub 서비스 시작..."
cd "$PROJECT_DIR"

# 환경변수 파일 확인
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo "[INFO] .env 파일 생성 중..."
    cp .env.example .env
fi

# SSO_ENABLED 환경변수 설정
export SSO_ENABLED=$SSO_MODE

# podman-compose 실행
podman-compose up -d

echo ""
echo "========================================"
echo " kohub 개발 환경 시작 완료!"
echo "========================================"
echo ""
echo " 접속 정보:"
echo "   Frontend:   http://localhost:3002"
echo "   Backend:    http://localhost:8082"
echo "   Swagger:    http://localhost:8082/swagger-ui.html"
if [ "$SSO_MODE" = "true" ]; then
echo "   Keycloak:   http://localhost:8180 (kecp-sso)"
fi
echo "   PostgreSQL: localhost:5434"
echo ""
echo " 로그 확인: podman-compose logs -f"
echo " 종료:      podman-compose down"
echo ""
echo " 전체 플랫폼 관리: ./scripts/start-platform.sh {all|stop|status}"
echo ""
