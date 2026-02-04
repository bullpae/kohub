# kohub Agent Guide

## Project Overview
kohub는 MSP(Managed Service Provider) 운영을 위한 통합 플랫폼입니다. 
외부 도구(Uptime Kuma, Termix 등)를 연계하여 모니터링 → 장애 대응 → 이력 관리 → AI 활용의 순환 구조를 제공합니다.

## Core Concept: Hub & Spoke Architecture

```mermaid
flowchart TB
    subgraph kohub[kohub - 허브]
        TS[티켓 시스템]
        DB[통합 대시보드]
        AL[어댑터 레이어]
    end
    
    subgraph External[외부 도구]
        UK[Uptime Kuma<br/>모니터링]
        TX[Termix<br/>SSH 터미널]
        FT[Future Tools<br/>Prometheus, etc.]
    end
    
    UK <-->|Webhook| AL
    TX <-->|iframe/API| AL
    FT <-->|Adapter| AL
    
    style kohub fill:#dbeafe,stroke:#2563eb
    style UK fill:#dcfce7,stroke:#16a34a
    style TX fill:#fef3c7,stroke:#d97706
    style FT fill:#f3e8ff,stroke:#9333ea
```

## Tech Stack

```mermaid
mindmap
  root((kohub))
    Backend
      Spring Boot 3.2.x
      Java 17
      Maven
    Frontend
      Vite
      React 19
      TypeScript
      Tailwind CSS
    Database
      PostgreSQL 16
      Flyway
    Auth
      Keycloak
      OIDC/SSO
    Infra
      Docker
      Podman Compose
    AI Phase2
      LangChain
      Vector DB
```

## Repo Layout

```
kohub/
├── AGENT.md              # 이 파일
├── README.md             # 프로젝트 소개
├── docs/                 # 설계 문서
│   ├── 01_prd.md         # 제품 요구사항
│   ├── 02_architecture.md # 아키텍처 설계
│   ├── 03_api_design.md  # API 설계
│   ├── 04_adapter_spec.md # 어댑터 명세
│   └── 05_ux_design.md   # UI/UX 설계
├── backend/              # Spring Boot 서비스
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/
├── frontend/             # React 앱
│   ├── package.json
│   ├── Dockerfile
│   └── src/
├── keycloak/             # SSO 설정
│   └── import/
├── scripts/              # 유틸리티 스크립트
├── compose.yml           # 개발 환경
├── compose.prod.yml      # 프로덕션 환경
└── .github/              # CI/CD
    └── workflows/
```

## Quick Start (Local Dev)

### Docker/Podman 실행
```bash
# 개발 환경 실행
docker compose up -d

# 또는 Podman
podman-compose up -d
```

### 포트 정보
| 서비스 | 포트 | 설명 |
|--------|------|------|
| DB | 5434 | PostgreSQL |
| Backend | 8082 | Spring Boot API |
| Frontend | 3002 | React Dev Server |
| Keycloak | 8083 | SSO 서버 |

### Health Check
- Backend: `GET http://localhost:8082/actuator/health`
- Frontend: `http://localhost:3002`

## Core Domains

### 도메인 모델 관계도

```mermaid
erDiagram
    Organization ||--o{ Host : contains
    Organization ||--o{ User : has
    Organization ||--o{ Ticket : owns
    
    Host ||--o{ Ticket : related
    Host {
        uuid id PK
        string name
        string description
        enum connectionType
        jsonb sshConfig
        jsonb adapters
        string[] tags
        enum status
    }
    
    User ||--o{ Ticket : creates
    User ||--o{ Ticket : assigned
    User }o--o{ Role : has
    User {
        uuid id PK
        string keycloakId
        string email
        string name
    }
    
    Ticket ||--o{ Activity : has
    Ticket ||--o{ TerminalLog : contains
    Ticket {
        uuid id PK
        string title
        string description
        enum source
        string sourceEventId
        enum status
        enum priority
        string resolution
    }
    
    Role ||--o{ Permission : has
    Role {
        uuid id PK
        string name
    }
    
    Organization {
        uuid id PK
        string name
        uuid parentId FK
        jsonb settings
    }
```

### 티켓 상태 흐름

```mermaid
stateDiagram-v2
    [*] --> NEW: 생성
    
    NEW --> RECEIVED: 접수
    RECEIVED --> ASSIGNED: 담당자 배정
    ASSIGNED --> IN_PROGRESS: 처리 시작
    IN_PROGRESS --> PENDING: 보류
    PENDING --> IN_PROGRESS: 재개
    IN_PROGRESS --> RESOLVED: 해결
    RESOLVED --> COMPLETED: 고객 확인
    COMPLETED --> CLOSED: 종료
    
    COMPLETED --> REOPENED: 재오픈
    REOPENED --> RECEIVED: 재접수
    
    NEW --> CLOSED: 취소/중복
```

## Adapter Interface

### 어댑터 구조

```mermaid
classDiagram
    class ToolAdapter {
        <<interface>>
        +getName() String
        +getType() AdapterType
        +handleWebhook(payload) TicketCreateRequest
        +getStatus(hostId) HostStatus
        +executeAction(action, params) ActionResult
    }
    
    class AdapterType {
        <<enumeration>>
        MONITORING
        TERMINAL
        AUTOMATION
        NOTIFICATION
    }
    
    class UptimeKumaAdapter {
        -baseUrl String
        -apiKey String
        +handleWebhook(payload)
        +getMonitors()
    }
    
    class TermixAdapter {
        -baseUrl String
        +getTerminalUrl(hostId)
        +getSessionLogs(sessionId)
    }
    
    class PrometheusAdapter {
        -baseUrl String
        +handleWebhook(payload)
        +queryMetrics(query)
    }
    
    ToolAdapter <|.. UptimeKumaAdapter
    ToolAdapter <|.. TermixAdapter
    ToolAdapter <|.. PrometheusAdapter
    ToolAdapter --> AdapterType
```

### 지원 어댑터 (계획)
| 어댑터 | 타입 | 상태 |
|--------|------|------|
| uptime-kuma | MONITORING | Phase 1 |
| termix | TERMINAL | Phase 1 |
| prometheus | MONITORING | Phase 2 |
| slack | NOTIFICATION | Phase 2 |
| ansible | AUTOMATION | Phase 3 |

## API Design

### Base URL
- API: `/api/v1`
- 인증: Bearer JWT (Keycloak)

### API 흐름

```mermaid
sequenceDiagram
    actor Client
    participant API as kohub API
    participant KC as Keycloak
    participant DB as PostgreSQL
    participant UK as Uptime Kuma
    
    Client->>KC: 1. 로그인 요청
    KC-->>Client: 2. JWT 토큰 발급
    
    Client->>API: 3. API 요청 (Bearer Token)
    API->>KC: 4. 토큰 검증
    KC-->>API: 5. 검증 결과
    
    API->>DB: 6. 데이터 조회/저장
    DB-->>API: 7. 결과
    API-->>Client: 8. 응답
    
    UK->>API: Webhook (장애 알림)
    API->>DB: 티켓 자동 생성
```

### 주요 Endpoints
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/v1/hosts | 호스트 목록 |
| POST | /api/v1/hosts | 호스트 등록 |
| GET | /api/v1/tickets | 티켓 목록 |
| POST | /api/v1/tickets | 티켓 생성 |
| POST | /api/v1/tickets/{id}/assign | 담당자 배정 |
| POST | /api/v1/tickets/{id}/resolve | 해결 처리 |
| GET | /api/v1/dashboard/summary | 대시보드 요약 |
| POST | /api/v1/webhooks/uptime-kuma | Uptime Kuma Webhook |

### 응답 형식
```json
// 성공
{
  "data": { ... },
  "meta": { "timestamp": "...", "requestId": "..." }
}

// 에러
{
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "티켓을 찾을 수 없습니다",
    "details": { ... }
  }
}

// 페이지네이션
{
  "data": [ ... ],
  "page": { "number": 0, "size": 20, "totalElements": 100, "totalPages": 5 }
}
```

## Auth & Authorization

### 인증 아키텍처

```mermaid
flowchart LR
    subgraph Users[사용자]
        U1[MSP 운영자]
        U2[고객]
    end
    
    subgraph KC[Keycloak]
        Login[로그인]
        Roles[역할 관리]
    end
    
    subgraph Apps[애플리케이션]
        FE[Frontend]
        BE[Backend]
        TX[Termix]
    end
    
    U1 --> Login
    U2 --> Login
    Login -->|OIDC| FE
    Login -->|OIDC| TX
    FE -->|JWT| BE
    Roles --> BE
    
    style KC fill:#fee2e2
```

### Keycloak 역할
| 역할 | 설명 |
|------|------|
| msp-admin | 시스템 전체 관리자 |
| msp-operator | 운영자 (장애 대응) |
| msp-viewer | 읽기 전용 |
| customer-admin | 고객사 관리자 |
| customer | 일반 고객 |

### 권한 매핑
```java
@PreAuthorize("hasRole('msp-admin') or hasRole('msp-operator')")
public void assignTicket(...) { }

@PreAuthorize("@hostSecurity.canAccess(#hostId)")
public void connectTerminal(String hostId) { }
```

## Development Workflow

### 1. 테스트 실행
```bash
# Backend 테스트
cd backend
./mvnw test

# Frontend 린트
cd frontend
npm run lint
npm run type-check
```

### 2. 빌드 검증
```bash
# Backend
cd backend
./mvnw clean compile

# Frontend
cd frontend
npm run build
```

### 3. Commit 규칙
```bash
# 커밋 메시지 (한글)
git commit -m "feat: 호스트 관리 API 구현"
git commit -m "fix: 티켓 상태 전이 버그 수정"
git commit -m "refactor: 어댑터 인터페이스 개선"
```

### 커밋 타입
- `feat:` 새 기능
- `fix:` 버그 수정
- `refactor:` 리팩토링
- `docs:` 문서 수정
- `test:` 테스트 추가/수정
- `chore:` 기타 변경

## Phase Plan

```mermaid
gantt
    title kohub 개발 로드맵
    dateFormat  YYYY-MM-DD
    
    section Phase 1 - MVP
    프로젝트 초기 구조     :done, p1-1, 2026-01-29, 1d
    Host CRUD             :p1-2, after p1-1, 3d
    Ticket CRUD           :p1-3, after p1-2, 5d
    Keycloak 연동         :p1-4, after p1-3, 3d
    Uptime Kuma 어댑터    :p1-5, after p1-4, 3d
    Termix 연동           :p1-6, after p1-5, 2d
    기본 대시보드         :p1-7, after p1-6, 3d
    
    section Phase 2 - 확장
    AI 추천 (RAG)         :p2-1, after p1-7, 5d
    터미널 로그 수집      :p2-2, after p2-1, 3d
    Prometheus 어댑터     :p2-3, after p2-2, 3d
    Slack/Teams 알림      :p2-4, after p2-3, 2d
    
    section Phase 3 - 고도화
    Ansible 자동화        :p3-1, after p2-4, 5d
    런북 실행             :p3-2, after p3-1, 3d
    리포트 생성           :p3-3, after p3-2, 3d
    AI 파인튜닝           :p3-4, after p3-3, 5d
```

### Phase 1: MVP
- [x] 프로젝트 초기 구조
- [ ] Host CRUD
- [ ] Ticket CRUD + 상태 관리
- [ ] Keycloak 연동
- [ ] Uptime Kuma Webhook 어댑터
- [ ] Termix iframe 연동
- [ ] 기본 대시보드

### Phase 2: 확장
- [ ] AI 추천 (RAG 기반)
- [ ] 터미널 로그 수집
- [ ] Prometheus 어댑터
- [ ] Slack/Teams 알림

### Phase 3: 고도화
- [ ] Ansible 자동화 연동
- [ ] 런북 실행
- [ ] 리포트 생성
- [ ] AI 파인튜닝

## Conventions

### 코드 규칙
- 테스트 함수명: `test[Method]_Scenario` (영어)
- @DisplayName / 주석 / 커밋 메시지: 한글
- API 응답: 일관된 DTO 사용

### 파일 명명
- Backend: PascalCase (Java 표준)
- Frontend: PascalCase (컴포넌트), camelCase (유틸)
- API: kebab-case

---

## References
- [Uptime Kuma](https://github.com/louislam/uptime-kuma)
- [Termix](https://github.com/Termix-SSH/Termix)
- [Keycloak](https://www.keycloak.org/)
- [KustHub](../KustHub) - 고객 커뮤니케이션 허브 (연계 대상)
- [StockHub](../StockHub) - 참고 프로젝트
- [UI/UX 설계](./docs/05_ux_design.md)
- [KustHub 연계 설계](./docs/06_integration_design.md)

## Changelog

- 2026-01-30: KustHub 연계 설계 문서 추가 (06_integration_design.md)
  - 세부 도메인 모델 설계
  - 이벤트 기반 연계 아키텍처
  - API 설계 상세
