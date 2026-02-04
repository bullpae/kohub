#!/bin/bash
# ================================
# kohub 개발 환경 시작 스크립트
# 
# 사용법:
#   ./scripts/start-dev.sh
# ================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SSO_DIR="$PROJECT_DIR/../kecp-sso"

echo "🚀 kohub 개발 환경 시작"
echo ""

# 1. kecp-sso 확인 및 시작
if [ -d "$SSO_DIR" ]; then
    echo "📦 kecp-sso 네트워크 확인..."
    
    # kecp-sso 네트워크가 없으면 SSO 서비스 시작
    if ! podman network exists kecp-sso_kecp-sso-network 2>/dev/null; then
        echo "   kecp-sso 서비스 시작 중..."
        cd "$SSO_DIR"
        podman-compose up -d
        echo "   ⏳ Keycloak 시작 대기 (30초)..."
        sleep 30
        cd "$PROJECT_DIR"
    else
        echo "   ✅ kecp-sso 네트워크 존재"
    fi
else
    echo "⚠️  kecp-sso 디렉토리가 없습니다: $SSO_DIR"
    echo "   SSO 없이 개발 모드로 실행합니다."
fi

# 2. kohub 서비스 시작
echo ""
echo "📦 kohub 서비스 시작..."
cd "$PROJECT_DIR"

# 환경변수 파일 확인
if [ ! -f ".env" ]; then
    echo "   .env 파일 생성 중..."
    cp .env.example .env
fi

# podman-compose 실행
podman-compose up -d

echo ""
echo "✅ kohub 개발 환경 시작 완료!"
echo ""
echo "📍 접속 정보:"
echo "   - Frontend:  http://localhost:3002"
echo "   - Backend:   http://localhost:8082"
echo "   - Swagger:   http://localhost:8082/swagger-ui.html"
echo "   - Keycloak:  http://localhost:8180 (kecp-sso)"
echo "   - PostgreSQL: localhost:5434"
echo ""
echo "📝 로그 확인:"
echo "   podman-compose logs -f"
echo ""
echo "🛑 종료:"
echo "   podman-compose down"
