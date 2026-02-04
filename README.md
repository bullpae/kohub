# kohub

MSP(Managed Service Provider) 통합 운영 플랫폼

## 개요

kohub는 모니터링, 장애 대응, 이력 관리를 하나의 플랫폼으로 통합합니다.

```mermaid
flowchart LR
    A[모니터링] -->|이벤트 발생| B[티켓 생성]
    B -->|원클릭| C[터미널 접속]
    C --> D[장애 해결]
    D --> E[이력 저장]
    E --> F[AI 학습]
    F -->|기능 개선| A
    
    style A fill:#fee2e2
    style B fill:#fef3c7
    style C fill:#dbeafe
    style D fill:#dcfce7
    style E fill:#f3e8ff
    style F fill:#fce7f3
```

## 주요 기능

- **통합 대시보드**: 모든 시스템 상태를 한눈에
- **티켓 시스템**: 장애/요청 이력 관리
- **터미널 연동**: 원클릭 SSH 접속 (Termix 연동)
- **모니터링 연동**: Uptime Kuma Webhook 수신
- **권한 관리**: Keycloak SSO 기반 통합 인증
- **AI 추천**: 유사 장애 해결책 제안 (Phase 2)

## 아키텍처

```mermaid
flowchart TB
    subgraph kohub[kohub - 허브]
        direction TB
        TS[🎫 티켓 시스템]
        DB[📊 통합 대시보드]
        AL[🔌 어댑터 레이어]
    end
    
    subgraph External[외부 도구]
        UK[Uptime Kuma<br/>🔍 모니터링]
        TX[Termix<br/>💻 SSH 터미널]
        FT[Future Tools<br/>📈 Prometheus, etc.]
    end
    
    subgraph Auth[인증]
        KC[Keycloak<br/>🔐 SSO]
    end
    
    UK <-->|Webhook| AL
    TX <-->|iframe/API| AL
    FT <-->|Adapter| AL
    KC <-->|OIDC| kohub
    
    style kohub fill:#dbeafe,stroke:#2563eb
    style UK fill:#dcfce7,stroke:#16a34a
    style TX fill:#fef3c7,stroke:#d97706
    style FT fill:#f3e8ff,stroke:#9333ea
    style KC fill:#fee2e2,stroke:#dc2626
```

## 기술 스택

```mermaid
flowchart LR
    subgraph Frontend
        V[Vite] --> R[React 18]
        R --> TS[TypeScript]
        R --> TW[Tailwind CSS]
    end
    
    subgraph Backend
        SB[Spring Boot 3.2] --> J[Java 17]
        SB --> JPA[JPA]
        SB --> FW[Flyway]
    end
    
    subgraph Database
        PG[(PostgreSQL 16)]
    end
    
    subgraph Auth
        KC[Keycloak]
    end
    
    subgraph Container
        DC[Docker Compose]
    end
    
    Frontend <--> Backend
    Backend <--> Database
    Backend <--> Auth
```

| 영역 | 기술 |
|------|------|
| Backend | Spring Boot 3.2, Java 17, Maven |
| Frontend | Vite, React 18, TypeScript, Tailwind CSS |
| Database | PostgreSQL 16, Flyway |
| Auth | Keycloak (OIDC/SSO) |
| Container | Docker/Podman Compose |

## 빠른 시작

### 요구사항

- Docker 또는 Podman
- Docker Compose 또는 Podman Compose

### 실행

```bash
# 저장소 클론
git clone https://github.com/bullpae/kohub.git
cd kohub

# 1. kecp-sso 먼저 시작 (Keycloak 인증)
cd ../kecp-sso
podman-compose up -d

# 2. kohub 시작
cd ../kohub
podman-compose up -d

# 또는 한번에 실행
./scripts/start-dev.sh
```

### 포트 정보

```mermaid
flowchart LR
    subgraph kohub
        FE[Frontend<br/>:3002]
        BE[Backend<br/>:8082]
        DB[(PostgreSQL<br/>:5434)]
    end
    
    subgraph kecp-sso
        KC[Keycloak<br/>:8180]
        KCDB[(KC-DB<br/>:5432)]
    end
    
    FE --> BE
    BE --> DB
    BE --> KC
    FE -.->|OIDC| KC
    KC --> KCDB
```

| 서비스 | 포트 | 설명 |
|--------|------|------|
| Frontend | 3002 | React Dev Server |
| Backend | 8082 | Spring Boot API |
| Database | 5434 | PostgreSQL |
| Keycloak | 8180 | SSO 인증 (kecp-sso) |

### 접속

- Frontend: http://localhost:3002
- Backend API: http://localhost:8082/api/v1
- API 문서: http://localhost:8082/swagger-ui.html
- Keycloak Admin: http://localhost:8180/admin (admin/admin123)

### 인증 모드

```mermaid
flowchart TB
    subgraph Dev["개발 모드 (기본)"]
        M1[VITE_SSO_ENABLED=false]
        M2[Mock 인증 사용]
    end
    
    subgraph SSO["SSO 모드"]
        S1[VITE_SSO_ENABLED=true]
        S2[Keycloak OIDC 사용]
    end
    
    Dev -.->|"환경변수 변경"| SSO
```

| 모드 | 환경변수 | 설명 |
|------|----------|------|
| 개발 (Mock) | `VITE_SSO_ENABLED=false` | 인증 없이 Mock 사용자로 개발 |
| SSO | `VITE_SSO_ENABLED=true` | kecp-sso (Keycloak) 인증 사용 |

## 프로젝트 구조

```mermaid
flowchart TB
    subgraph Root[kohub/]
        AGENT[AGENT.md]
        README[README.md]
        COMPOSE[compose.yml]
        
        subgraph Docs[docs/]
            D1[01_prd.md]
            D2[02_architecture.md]
            D3[03_api_design.md]
            D4[04_adapter_spec.md]
            D5[05_ux_design.md]
        end
        
        subgraph BE[backend/]
            POM[pom.xml]
            SRC1[src/main/java]
            SRC2[src/test/java]
        end
        
        subgraph FE[frontend/]
            PKG[package.json]
            SRCF[src/]
        end
        
        subgraph KC[keycloak/]
            IMP[import/]
        end
    end
```

## 개발

### Backend 개발

```bash
cd backend

# 의존성 설치 및 빌드
./mvnw clean compile

# 테스트 실행
./mvnw test

# 로컬 실행
./mvnw spring-boot:run
```

### Frontend 개발

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 타입 체크
npm run type-check

# 린트
npm run lint

# 빌드
npm run build
```

## 로드맵

```mermaid
timeline
    title kohub 개발 로드맵
    
    section Phase 1 - MVP ✅
        프로젝트 초기화 : 완료
        Host/Ticket CRUD : 완료
        User/Organization : 완료
        Dashboard 통합 API : 완료
        Keycloak SSO 연동 : 완료
        Uptime Kuma 어댑터 : 완료
        Termix 터미널 연동 : 완료
        PostgreSQL 통일 : 완료
    
    section Phase 2 - 확장
        AI 추천 (RAG) : 예정
        Prometheus 연동 : 예정
        Slack/Teams 알림 : 예정
    
    section Phase 3 - 고도화
        Ansible 자동화 : 예정
        리포트 생성 : 예정
        AI 파인튜닝 : 예정
```

## 문서

- [AGENT.md](./AGENT.md) - 프로젝트 상세 가이드
- [docs/01_prd.md](./docs/01_prd.md) - 제품 요구사항
- [docs/02_architecture.md](./docs/02_architecture.md) - 아키텍처 설계
- [docs/03_api_design.md](./docs/03_api_design.md) - API 설계
- [docs/04_adapter_spec.md](./docs/04_adapter_spec.md) - 어댑터 명세
- [docs/05_ux_design.md](./docs/05_ux_design.md) - UI/UX 설계
- [docs/06_integration_design.md](./docs/06_integration_design.md) - KustHub 연계 설계

## 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: 기능 설명'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 라이선스

MIT License
