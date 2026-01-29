# kohub UI/UX 설계

## 1. 사용자(Actor) 정의

| Actor | 역할 | 주요 관심사 |
|-------|------|------------|
| **MSP 관리자** | 시스템 전체 관리 | 설정, 사용자 관리, 리포트 |
| **MSP 운영자** | 장애 대응, 일상 운영 | 모니터링, 티켓 처리, 터미널 |
| **접수 담당자** | 티켓 접수/배정 | 티켓 분류, 담당자 배정 |
| **고객사 관리자** | 자사 서버 현황 파악 | 상태 조회, 티켓 요청 |
| **고객** | 서비스 요청 | 티켓 생성, 진행 상황 확인 |

---

## 2. 핵심 Use Case

### UC-01: 장애 발생 → 즉시 대응 (핵심 플로우)

```mermaid
flowchart LR
    subgraph 외부시스템
        UK[Uptime Kuma]
    end
    
    subgraph kohub
        A[1. 알림 수신<br/>푸시/소리] --> B[2. 티켓 자동생성<br/>CRITICAL]
        B --> C[3. 대시보드 표시<br/>빨간불 점등]
        C --> D[4. 터미널 접속<br/>원클릭]
        D --> E[5. 명령어 실행<br/>로그 자동저장]
        E --> F[6. 해결 기록<br/>이력 저장]
    end
    
    subgraph 외부시스템2[" "]
        TX[Termix]
    end
    
    UK -->|Webhook| A
    D <-->|iframe| TX
    
    style A fill:#fee2e2
    style B fill:#fee2e2
    style C fill:#fef3c7
    style D fill:#dbeafe
    style E fill:#dbeafe
    style F fill:#dcfce7
```

**필요한 화면:**
- 실시간 알림 (토스트/사운드)
- 대시보드 (장애 현황 한눈에)
- 티켓 상세 (즉시 터미널 연결)
- 터미널 (iframe)
- 해결 기록 폼

---

### UC-02: 일상 모니터링

```mermaid
journey
    title 운영자의 아침 루틴
    section 출근
      대시보드 접속: 5: 운영자
      어젯밤 이벤트 확인: 4: 운영자
    section 현황 파악
      서버 상태 확인: 5: 운영자
      미처리 티켓 확인: 4: 운영자
    section 업무 시작
      우선순위 정렬: 3: 운영자
      첫 티켓 처리: 4: 운영자
```

**필요한 화면:**
- 대시보드 (요약 통계)
- 이벤트 타임라인
- 서버 상태 그리드
- 티켓 목록 (필터/정렬)

---

### UC-03: 티켓 처리 전체 흐름

```mermaid
stateDiagram-v2
    [*] --> NEW: 티켓 생성
    
    NEW --> RECEIVED: 접수
    RECEIVED --> ASSIGNED: 담당자 배정
    ASSIGNED --> IN_PROGRESS: 처리 시작
    IN_PROGRESS --> PENDING: 보류 (고객 확인 필요)
    PENDING --> IN_PROGRESS: 재개
    IN_PROGRESS --> RESOLVED: 해결
    RESOLVED --> COMPLETED: 고객 확인
    COMPLETED --> CLOSED: 종료
    
    COMPLETED --> REOPENED: 재오픈
    REOPENED --> RECEIVED: 재접수
    
    NEW --> CLOSED: 중복/취소
    
    note right of NEW: 자동 생성 또는<br/>수동 생성
    note right of RESOLVED: 담당자가<br/>해결 처리
    note right of COMPLETED: 고객이<br/>확인 완료
```

**필요한 화면:**
- 티켓 목록 (상태별 탭/칸반)
- 티켓 상세 (상태 전이 버튼)
- 담당자 배정 모달
- 활동 기록 타임라인

---

### UC-04: 고객 요청 접수

```mermaid
sequenceDiagram
    actor 고객
    participant 포털 as 고객 포털
    participant API as kohub API
    participant 알림 as 알림 시스템
    actor 담당자

    고객->>포털: 1. 포털 접속
    고객->>포털: 2. 새 요청 클릭
    포털->>고객: 3. 요청 폼 표시
    고객->>포털: 4. 내용 작성 & 제출
    포털->>API: 5. 티켓 생성 요청
    API->>알림: 6. 알림 발송
    알림->>담당자: 7. 새 티켓 알림
    API->>포털: 8. 티켓 번호 반환
    포털->>고객: 9. 접수 완료 표시
    
    loop 진행 상황 확인
        고객->>포털: 10. 내 요청 조회
        포털->>API: 상태 조회
        API->>포털: 현재 상태
        포털->>고객: 진행 상황 표시
    end
```

**필요한 화면:**
- 고객 포털 (심플한 UI)
- 요청 작성 폼
- 내 요청 목록
- 요청 상세 (진행 상황)

---

### UC-05: AI 추천 활용 (Phase 2)

```mermaid
flowchart TB
    subgraph 티켓상세[티켓 상세 화면]
        A[티켓 정보 표시]
        B[AI 추천 패널]
    end
    
    subgraph AI엔진[AI Engine]
        C[증상 분석]
        D[유사 사례 검색]
        E[해결책 추천]
    end
    
    subgraph 과거데이터[Vector DB]
        F[(과거 티켓)]
        G[(명령어 이력)]
        H[(해결 방법)]
    end
    
    A --> C
    C --> D
    D --> F
    D --> G
    D --> H
    F --> E
    G --> E
    H --> E
    E --> B
    
    B -->|원클릭 실행| I[터미널]
    I -->|결과 확인| J[해결 처리]
```

**필요한 화면:**
- AI 추천 패널 (티켓 상세 내)
- 유사 사례 목록
- 명령어 프리뷰/실행 버튼

---

## 3. 화면 구조 설계

### 3.1 전체 레이아웃

```mermaid
block-beta
    columns 5
    
    block:header:5
        logo["kohub"] space:2 notifications["알림"] user["사용자"]
    end
    
    block:sidebar:1
        nav["네비게이션<br/>───────<br/>대시보드<br/>호스트<br/>티켓<br/>터미널<br/>리포트<br/>설정"]
    end
    
    block:main:4
        content["메인 컨텐츠 영역<br/><br/>페이지별 내용 표시"]
    end
```

### 3.2 네비게이션 구조

```mermaid
flowchart TB
    subgraph Navigation
        A[대시보드] --> A1[요약 통계]
        A --> A2[실시간 알림]
        A --> A3[서버 상태 맵]
        
        B[호스트] --> B1[호스트 목록]
        B --> B2[호스트 추가]
        B --> B3[호스트 상세]
        
        C[티켓] --> C1[티켓 목록]
        C --> C2[티켓 생성]
        C --> C3[티켓 상세]
        C --> C4[칸반 보기]
        
        D[터미널] --> D1[세션 목록]
        D --> D2[새 세션]
        D --> D3[멀티 터미널]
        
        E[리포트] --> E1[장애 통계]
        E --> E2[처리 현황]
        E --> E3[SLA 리포트]
        
        F[설정] --> F1[어댑터 설정]
        F --> F2[사용자 관리]
        F --> F3[조직 관리]
        F --> F4[알림 설정]
    end
```

---

## 4. 주요 화면 상세 설계

### 4.1 대시보드 (Dashboard)

```mermaid
block-beta
    columns 4
    
    block:stats:4
        s1["🔴 장애<br/>2 서버"]
        s2["🟡 경고<br/>5 서버"]
        s3["🟢 정상<br/>43 서버"]
        s4["📋 미처리<br/>8 티켓"]
    end
    
    block:alerts:2
        a["🚨 긴급 알림<br/>────────────<br/>• web-prod-01 다운<br/>• db-master 응답지연"]
    end
    
    block:map:2
        m["📊 서버 상태 맵<br/>────────────<br/>[A사] 🟢🟢🔴<br/>[B사] 🟢🟡🟢<br/>[C사] 🟢🟢🟢"]
    end
    
    block:tickets:4
        t["📋 최근 티켓<br/>──────────────────────────────<br/>#123 | 🔴 CRITICAL | 서버 다운 | NEW<br/>#122 | 🟡 HIGH | 복제 지연 | 처리중<br/>#121 | 🟢 MEDIUM | 로그 확인 | 해결"]
    end
```

**핵심 UX:**
- 장애 시 빨간색이 눈에 확 들어오도록
- "터미널" 버튼으로 즉시 접속
- 실시간 갱신 (WebSocket)

---

### 4.2 티켓 상세 + 터미널 (Split View)

```mermaid
block-beta
    columns 2
    
    block:left:1
        info["티켓 정보<br/>──────────<br/>상태: 🔴 NEW<br/>우선순위: CRITICAL<br/>호스트: web-prod-01<br/>담당자: 미배정<br/><br/>[접수] [배정] [터미널]"]
        
        ai["💡 AI 추천<br/>──────────<br/>유사 사례 #98<br/>nginx 재시작으로 해결<br/>[명령어 보기] [적용]"]
        
        log["📋 활동 기록<br/>──────────<br/>• 10:15 티켓 생성<br/>• 10:17 터미널 접속"]
    end
    
    block:right:1
        term["터미널 (Termix iframe)<br/>─────────────────────<br/>$ systemctl status nginx<br/>● nginx.service<br/>  Active: failed<br/><br/>$ systemctl restart nginx<br/>$ systemctl status nginx<br/>  Active: active (running)"]
        
        resolve["해결 방법 입력<br/>─────────────────────<br/>[nginx 재시작으로 해결]<br/><br/>[해결 완료]"]
    end
```

**핵심 UX:**
- 티켓 정보와 터미널을 한 화면에 (Split View)
- 명령어 자동 로깅
- AI 추천이 자연스럽게 표시
- 해결 방법 입력 후 바로 완료 처리

---

### 4.3 티켓 목록 (칸반 뷰)

```mermaid
block-beta
    columns 4
    
    block:new:1
        n["NEW (3)<br/>─────────<br/>🔴 #123<br/>web-prod-01<br/>서버 다운<br/><br/>🟡 #122<br/>API 지연"]
    end
    
    block:progress:1
        p["처리중 (5)<br/>─────────<br/>🟡 #120<br/>db-복제지연<br/>@김운영<br/><br/>🟢 #119<br/>디스크정리<br/>@이엔지"]
    end
    
    block:resolved:1
        r["해결됨 (12)<br/>─────────<br/>🟢 #118<br/>로그 확인<br/>@박담당<br/><br/>🟢 #117<br/>백업 확인<br/>@김운영"]
    end
    
    block:closed:1
        c["완료 (45)<br/>─────────<br/>#115<br/>SSL 갱신<br/><br/>#114<br/>보안패치"]
    end
```

---

### 4.4 고객 포털

```mermaid
block-beta
    columns 2
    
    block:header:2
        h["kohub 고객 포털          A사 | 홍길동 님"]
    end
    
    block:main:2
        q["무엇을 도와드릴까요?"]
    end
    
    block:actions:2
        a1["🚨 장애 신고"]
        a2["📝 요청 등록"]
        a3["💬 문의 하기"]
        a4["📋 내역 조회"]
    end
    
    block:notice:2
        n["📢 공지사항<br/>• 1/30 02:00-04:00 정기 점검<br/>• 신규 모니터링 기능 추가"]
    end
```

---

## 5. 화면 흐름도

### 5.1 장애 대응 흐름

```mermaid
flowchart TD
    A[대시보드] -->|알림 클릭| B[티켓 상세]
    B -->|터미널 버튼| C[Split View<br/>티켓+터미널]
    C -->|명령어 실행| D[자동 로깅]
    D -->|해결| E[해결 기록 입력]
    E -->|저장| F[티켓 상태 변경]
    F -->|완료| A
    
    style A fill:#dbeafe
    style C fill:#fef3c7
    style F fill:#dcfce7
```

### 5.2 티켓 생성 흐름

```mermaid
flowchart TD
    subgraph 자동생성
        A1[Uptime Kuma<br/>Webhook] --> B1[티켓 자동 생성]
        B1 --> C[티켓 목록]
    end
    
    subgraph 수동생성
        A2[티켓 목록] -->|+ 버튼| B2[티켓 생성 폼]
        B2 -->|호스트 선택| D[호스트 검색]
        D --> B2
        B2 -->|제출| C
    end
    
    subgraph 고객요청
        A3[고객 포털] -->|요청 등록| B3[요청 폼]
        B3 -->|제출| C
    end
```

---

## 6. UI/UX 핵심 원칙

```mermaid
mindmap
  root((kohub UX))
    1클릭 액션
      장애→터미널 즉시
      상태 전이 버튼
      빠른 배정
    실시간 피드백
      WebSocket
      알림 토스트
      상태 자동 갱신
    정보 밀도
      한 화면에 필요 정보
      요약→상세 드릴다운
      컨텍스트 메뉴
    시각적 우선순위
      🔴🟡🟢 색상
      아이콘 활용
      크기로 강조
    효율성
      키보드 단축키
      Split View
      멀티 터미널
```

---

## 7. 반응형 설계

```mermaid
flowchart LR
    subgraph Desktop["Desktop (≥1280px)"]
        D1[사이드바] --- D2[Split View 가능]
    end
    
    subgraph Tablet["Tablet (768-1279px)"]
        T1[축소 사이드바] --- T2[Single View]
    end
    
    subgraph Mobile["Mobile (<768px)"]
        M1[Bottom Nav] --- M2[Single View]
    end
    
    Desktop --> Tablet --> Mobile
```

---

## 8. 컴포넌트 계층

```mermaid
classDiagram
    class App {
        +Router
        +AuthProvider
        +QueryProvider
    }
    
    class Layout {
        +Sidebar
        +Header
        +MainContent
    }
    
    class Dashboard {
        +StatCards
        +AlertPanel
        +ServerMap
        +TicketList
    }
    
    class TicketDetail {
        +TicketInfo
        +AIRecommendation
        +ActivityLog
        +TerminalPanel
    }
    
    class HostList {
        +SearchBar
        +FilterBar
        +HostTable
        +Pagination
    }
    
    App --> Layout
    Layout --> Dashboard
    Layout --> TicketDetail
    Layout --> HostList
```

---

## 9. 색상 시스템

| 용도 | 색상 | Tailwind |
|------|------|----------|
| 장애/Critical | 🔴 Red | `red-500` |
| 경고/High | 🟡 Yellow | `yellow-500` |
| 정상/Low | 🟢 Green | `green-500` |
| 정보/Medium | 🔵 Blue | `blue-500` |
| 비활성 | ⚫ Gray | `gray-400` |
| 프라이머리 | - | `primary-600` |
| 배경 | - | `gray-50` |
| 카드 배경 | - | `white` |

---

## 10. 키보드 단축키 (계획)

| 단축키 | 동작 |
|--------|------|
| `G` + `D` | 대시보드로 이동 |
| `G` + `H` | 호스트 목록으로 이동 |
| `G` + `T` | 티켓 목록으로 이동 |
| `N` | 새 티켓 생성 |
| `T` | 터미널 열기 (티켓 상세에서) |
| `/` | 검색 포커스 |
| `Esc` | 모달/패널 닫기 |
| `?` | 단축키 도움말 |

---

## 11. 다음 단계

1. **Figma/디자인 툴**로 상세 UI 디자인
2. **프로토타입** 제작 및 사용자 테스트
3. **컴포넌트 라이브러리** 구축
4. **페이지별 구현** 진행
