# K-ECP 플랫폼 배포·유지관리 전략

> 작성일: 2026-02-07
> 대상: kecp-sso, KustHub, kohub, Uptime Kuma, Termix

---

## 1. 현황 분석

### 1.1 서비스 구성

| 서비스 | 역할 | 기술스택 | 포트(dev) |
|--------|------|----------|-----------|
| **kecp-sso** | 통합 인증(SSO) | Keycloak 24 + PostgreSQL 15 | 8180 |
| **KustHub** | 고객 포탈(고객센터) | React 19 + Spring Boot 3.2 | 4000, 8081 |
| **kohub** | MSP 운영 센터 | React 18 + Spring Boot 3.2 | 3002, 8082 |
| **Uptime Kuma** | 서비스 모니터링 | Node.js | 3001 |
| **Termix** | 웹 SSH 터미널 | Node.js | 8080 |

### 1.2 인프라 의존성

```
                    ┌─────────────┐
                    │  kecp-sso   │
                    │ (Keycloak)  │
                    └──────┬──────┘
                           │ JWT/OIDC
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ KustHub  │ │  kohub   │ │   기타   │
        │(고객포탈) │ │(운영센터) │ │ 서비스   │
        └──────────┘ └────┬─────┘ └──────────┘
                          │
                ┌─────────┼─────────┐
                ▼         ▼         ▼
          ┌──────────┐ ┌───────┐ ┌──────────┐
          │Uptime    │ │Termix │ │Prometheus│
          │Kuma      │ │(SSH)  │ │(선택)    │
          └──────────┘ └───────┘ └──────────┘
```

### 1.3 현재 문제점

| 구분 | 문제 | 영향 |
|------|------|------|
| DB 중복 | PostgreSQL 인스턴스 3개 (keycloak, kusthub, kohub) | 메모리 낭비, 관리 분산 |
| 포트 난립 | 8개+ 포트가 각각 노출 | 접근 혼란, 방화벽 관리 어려움 |
| CI/CD 부재 | 수동 배포 (podman-compose) | 배포 실수 위험, 느린 배포 |
| 통합 부재 | 3개 compose 파일 분산 관리 | 기동 순서 오류, 의존성 깨짐 |
| 모니터링 공백 | 플랫폼 자체 모니터링 없음 | 장애 인지 지연 |
| 백업 없음 | DB 백업 스크립트 없음 | 데이터 손실 위험 |
| SSL 없음 | HTTP만 사용 | 보안 취약 |

---

## 2. 목표 아키텍처

### 2.1 설계 원칙

1. **Single Entry Point** — Nginx 리버스 프록시로 단일 진입점 (80/443)
2. **DB 통합** — PostgreSQL 1대에 다중 데이터베이스
3. **네트워크 격리** — 서비스별 내부 네트워크, 외부 노출 최소화
4. **자동화** — CI/CD 파이프라인으로 빌드→테스트→배포 자동화
5. **모니터링 통합** — Uptime Kuma가 자기 자신 포함 전체 플랫폼 모니터링
6. **무중단 배포** — 롤링 업데이트 + 즉시 롤백

### 2.2 목표 아키텍처 다이어그램

```
 사용자
  │
  ▼ (80/443)
┌──────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                    │
│                                                          │
│  /              → kohub Frontend                         │
│  /api/          → kohub Backend                          │
│  /support/      → KustHub Frontend                       │
│  /support/api/  → KustHub Backend                        │
│  /auth/         → Keycloak                               │
│  /monitor/      → Uptime Kuma                            │
│  /terminal/     → Termix                                 │
└──────────────┬───────────────────────────────────────────┘
               │ Internal Network
┌──────────────┴───────────────────────────────────────────┐
│                   Docker/Podman Network                    │
│                                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐   │
│  │ kohub   │ │ kohub   │ │KustHub  │ │  KustHub    │   │
│  │Frontend │ │Backend  │ │Frontend │ │  Backend    │   │
│  │  :80    │ │  :8080  │ │  :80    │ │   :8080     │   │
│  └─────────┘ └────┬────┘ └─────────┘ └──────┬──────┘   │
│                    │                          │           │
│  ┌─────────┐ ┌────┴──────────────────────────┴────────┐ │
│  │Keycloak │ │         PostgreSQL (공유)               │ │
│  │  :8080  │ │  DB: keycloak, kusthub, kohub          │ │
│  └─────────┘ └────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────┐ ┌─────────┐ ┌─────────┐                  │
│  │Uptime    │ │ Termix  │ │  Redis  │                  │
│  │Kuma :3001│ │  :8080  │ │  :6379  │                  │
│  └──────────┘ └─────────┘ └─────────┘                  │
└──────────────────────────────────────────────────────────┘
```

### 2.3 포트 매핑 (개선 전 → 후)

| 구분 | 현재 | 개선 후 |
|------|------|---------|
| 외부 노출 포트 | 8개+ (8180, 4000, 8081, 3002, 8082, 3001, 8080, 5433, 5434) | **2개** (80, 443) |
| DB 인스턴스 | 3개 | **1개** (다중 DB) |
| 리버스 프록시 | 없음 | Nginx 1대 |

---

## 3. 환경 구성

### 3.1 환경별 구성

| 환경 | 용도 | 배포 방식 | 구성 |
|------|------|-----------|------|
| **dev** | 로컬 개발 | `compose.yml` (기존 유지) | 포트 직접 노출, 핫리로드 |
| **staging** | 통합 테스트 | `compose.platform.yml` | 프로덕션 동일 구성, 축소 자원 |
| **prod** | 운영 | `compose.platform.yml` | 풀 자원, SSL, 백업, 모니터링 |

### 3.2 환경 변수 관리

```bash
# 환경별 .env 파일
.env.dev          # 개발 (기존 유지)
.env.staging      # 스테이징
.env.prod         # 운영 (git 미추적, 서버에서 관리)
```

---

## 4. 통합 Compose 구성 (compose.platform.yml)

> 별도 파일로 생성: `/home/bullpae/repo/kohub/compose.platform.yml`

### 4.1 서비스 구성 요약

| 서비스 | 이미지 | 내부 포트 | 의존성 |
|--------|--------|-----------|--------|
| nginx | nginx:alpine | 80, 443 | frontend, backend 전부 |
| postgres | postgres:16-alpine | 5432 | - |
| redis | redis:7-alpine | 6379 | - |
| keycloak | keycloak:24 | 8080 | postgres |
| kohub-backend | 빌드 | 8080 | postgres, keycloak |
| kohub-frontend | 빌드 | 80 | kohub-backend |
| kusthub-backend | 빌드 | 8080 | postgres, redis, keycloak |
| kusthub-frontend | 빌드 | 80 | kusthub-backend |
| uptime-kuma | louislam/uptime-kuma | 3001 | - |
| termix | termix | 8080 | - |

### 4.2 네트워크 설계

```
kecp-platform-network (bridge)
├── nginx              (외부 80/443)
├── postgres           (내부 전용)
├── redis              (내부 전용)
├── keycloak           (내부 전용)
├── kohub-backend      (내부 전용)
├── kohub-frontend     (내부 전용)
├── kusthub-backend    (내부 전용)
├── kusthub-frontend   (내부 전용)
├── uptime-kuma        (내부 전용)
└── termix             (내부 전용)
```

### 4.3 볼륨 설계

| 볼륨 | 용도 | 백업 필요 |
|------|------|----------|
| `kecp-postgres-data` | PostgreSQL 데이터 | **YES** (일 1회) |
| `kecp-redis-data` | Redis 데이터 | NO (캐시) |
| `kecp-keycloak-themes` | Keycloak 테마 | NO (코드에 포함) |
| `uptime-kuma-data` | 모니터링 데이터 | YES (주 1회) |
| `termix-data` | SSH 설정 | YES (주 1회) |
| `nginx-ssl` | SSL 인증서 | YES (갱신 시) |

---

## 5. Nginx 리버스 프록시 설계

### 5.1 URL 라우팅 규칙

| URL 패턴 | 대상 서비스 | 설명 |
|----------|------------|------|
| `/` | kohub-frontend | MSP 운영 센터 (메인) |
| `/api/` | kohub-backend | kohub API |
| `/support/` | kusthub-frontend | 고객 포탈 |
| `/support/api/` | kusthub-backend | KustHub API |
| `/auth/` | keycloak | SSO 인증 |
| `/monitor/` | uptime-kuma | 모니터링 대시보드 |
| `/terminal/` | termix | SSH 터미널 |

### 5.2 보안 설정

- SSL/TLS 종료 (Let's Encrypt 또는 자체 인증서)
- HSTS 헤더
- Rate limiting (API 엔드포인트)
- 보안 헤더 (X-Frame-Options, CSP 등)
- WebSocket 프록시 (Uptime Kuma, Termix에 필요)

---

## 6. CI/CD 전략

### 6.1 파이프라인 구성

```
Push to main → Build → Test → Docker Build → Deploy Staging → (수동승인) → Deploy Prod
                 │       │         │                │
                 │       │         ├─ kohub-backend
                 │       │         ├─ kohub-frontend
                 │       │         ├─ kusthub-backend
                 │       │         └─ kusthub-frontend
                 │       │
                 │       ├─ Backend 단위 테스트
                 │       ├─ Frontend TypeScript 검증
                 │       └─ (선택) E2E 테스트
                 │
                 ├─ Maven build (backend)
                 └─ npm build (frontend)
```

### 6.2 GitHub Actions 워크플로우

> 별도 파일로 생성

### 6.3 배포 트리거

| 이벤트 | 동작 |
|--------|------|
| PR → main 병합 | 자동 빌드·테스트 |
| main push | staging 자동 배포 |
| 태그 생성 (`v*`) | prod 수동 승인 후 배포 |
| hotfix/* push | prod 긴급 배포 (승인 필요) |

---

## 7. 백업 전략

### 7.1 백업 대상 및 주기

| 대상 | 주기 | 보관 기간 | 방식 |
|------|------|----------|------|
| PostgreSQL 전체 | 매일 02:00 | 30일 | pg_dumpall → gzip |
| PostgreSQL 개별 DB | 매일 02:00 | 7일 | pg_dump per DB |
| Uptime Kuma 데이터 | 주 1회 | 4주 | 볼륨 스냅샷 |
| Keycloak realm 설정 | 변경 시 | 영구 | realm export |
| Docker 이미지 | 배포 시 | 직전 2버전 | image tag |

### 7.2 복원 절차

1. 서비스 중지
2. DB 복원: `gunzip -c backup.sql.gz | psql`
3. 볼륨 복원: `podman volume import`
4. 서비스 시작 및 검증

---

## 8. 모니터링 전략

### 8.1 Uptime Kuma 모니터링 대상

| 대상 | 모니터 타입 | 간격 | 알림 조건 |
|------|------------|------|----------|
| kohub Frontend | HTTP | 60초 | 3회 연속 실패 |
| kohub Backend | HTTP (`/actuator/health`) | 30초 | 2회 연속 실패 |
| KustHub Frontend | HTTP | 60초 | 3회 연속 실패 |
| KustHub Backend | HTTP (`/actuator/health`) | 30초 | 2회 연속 실패 |
| Keycloak | HTTP (`/health/ready`) | 60초 | 3회 연속 실패 |
| PostgreSQL | TCP (5432) | 30초 | 2회 연속 실패 |
| Redis | TCP (6379) | 30초 | 2회 연속 실패 |
| Nginx | HTTP | 30초 | 즉시 |

### 8.2 알림 채널

- Uptime Kuma → kohub 웹훅 (자동 티켓 생성)
- Slack/Teams 알림 (선택)
- 이메일 알림 (선택)

---

## 9. 롤백 전략

### 9.1 롤백 단계

```bash
# 1. 현재 상태 확인
./scripts/platform.sh status

# 2. 이전 버전으로 롤백
./scripts/platform.sh rollback

# 3. 검증
./scripts/platform.sh health

# 4. 실패 시 DB 롤백
./scripts/platform.sh rollback-db
```

### 9.2 롤백 소요 시간 목표

| 구분 | 목표 시간 |
|------|----------|
| 이미지 롤백 (앱만) | < 2분 |
| 이미지 + DB 롤백 | < 10분 |
| 전체 복원 (재해) | < 30분 |

---

## 10. 보안 체크리스트

- [ ] 모든 서비스 non-root 실행
- [ ] DB 외부 포트 비노출
- [ ] SSL/TLS 적용
- [ ] 환경변수로 시크릿 관리 (.env.prod는 git 미추적)
- [ ] Keycloak admin 비밀번호 강화
- [ ] Nginx rate limiting 적용
- [ ] 보안 헤더 설정 (HSTS, CSP, X-Frame-Options)
- [ ] 정기 이미지 업데이트 (보안 패치)

---

## 11. 운영 명령어 요약

```bash
# 플랫폼 관리
./scripts/platform.sh start       # 전체 시작
./scripts/platform.sh stop        # 전체 중지
./scripts/platform.sh restart     # 전체 재시작
./scripts/platform.sh status      # 상태 확인
./scripts/platform.sh health      # 헬스체크
./scripts/platform.sh logs [서비스] # 로그 확인
./scripts/platform.sh backup      # 백업
./scripts/platform.sh rollback    # 롤백
./scripts/platform.sh update [서비스]  # 개별 서비스 업데이트

# 개별 서비스 재시작 (무중단)
./scripts/platform.sh update kohub-backend
./scripts/platform.sh update kusthub-backend
```

---

## 12. 구현 우선순위

| 순서 | 항목 | 우선순위 | 난이도 | 효과 |
|------|------|---------|--------|------|
| 1 | 통합 Compose 구성 | **높음** | 중 | DB 통합, 포트 정리 |
| 2 | Nginx 리버스 프록시 | **높음** | 중 | 단일 진입점, SSL |
| 3 | 플랫폼 관리 스크립트 | **높음** | 낮 | 운영 편의성 |
| 4 | 백업 스크립트 | **높음** | 낮 | 데이터 안전 |
| 5 | GitHub Actions CI/CD | 중 | 중 | 자동화 |
| 6 | 모니터링 설정 | 중 | 낮 | 장애 인지 |
| 7 | SSL 적용 | 중 | 낮 | 보안 |
