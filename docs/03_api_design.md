# kohub API 설계

## 1. 기본 원칙
- Base URL: `/api/v1`
- 인증: Keycloak JWT (Bearer Token)
- 응답 포맷: data/meta 또는 error

## 2. 공통 응답
```json
{
  "data": { "...": "..." },
  "meta": { "timestamp": "2024-01-01T00:00:00Z", "requestId": "uuid" }
}
```

```json
{
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "티켓을 찾을 수 없습니다",
    "details": { "ticketId": "uuid" }
  }
}
```

## 3. 인증/권한
- 모든 요청은 JWT 필수
- 권한 예시:
  - `msp-admin`: 모든 조직/리소스 접근
  - `msp-operator`: 운영 범위 내 접근
  - `customer`: 자기 조직 리소스만 접근

## 4. 엔드포인트 설계
### 4.1 Hosts
| Method | Endpoint | 설명 |
|---|---|---|
| GET | /hosts | 호스트 목록 조회 |
| POST | /hosts | 호스트 생성 |
| GET | /hosts/{id} | 호스트 상세 조회 |
| PUT | /hosts/{id} | 호스트 수정 |
| DELETE | /hosts/{id} | 호스트 비활성화 |

#### Host DTO
```json
{
  "id": "uuid",
  "name": "web-prod-01",
  "description": "웹 서버",
  "connectionType": "SSH",
  "sshConfig": { "host": "10.0.0.1", "port": 22 },
  "adapters": ["uptime-kuma"],
  "tags": ["prod", "web"],
  "status": "ACTIVE"
}
```

### 4.2 Tickets
| Method | Endpoint | 설명 |
|---|---|---|
| GET | /tickets | 티켓 목록 |
| POST | /tickets | 티켓 생성 |
| GET | /tickets/{id} | 티켓 상세 |
| POST | /tickets/{id}/assign | 담당자 배정 |
| POST | /tickets/{id}/transition | 상태 전이 |
| POST | /tickets/{id}/resolve | 해결 처리 |

#### Ticket DTO
```json
{
  "id": "uuid",
  "title": "서버 다운",
  "description": "web-prod-01 응답 없음",
  "source": "UPTIME_KUMA",
  "status": "NEW",
  "priority": "CRITICAL",
  "assigneeId": "uuid",
  "hostId": "uuid",
  "resolution": "nginx 재시작"
}
```

#### 상태 전이 요청
```json
{
  "status": "IN_PROGRESS",
  "reason": "담당자 배정 완료"
}
```

### 4.3 Dashboard
| Method | Endpoint | 설명 |
|---|---|---|
| GET | /dashboard/summary | 요약 통계 |
| GET | /dashboard/alerts | 최근 알림 |

### 4.4 Webhooks
| Method | Endpoint | 설명 |
|---|---|---|
| POST | /webhooks/uptime-kuma | Uptime Kuma 이벤트 수신 |

#### Uptime Kuma Webhook Payload (예시)
```json
{
  "monitor": { "id": 1, "name": "web-prod-01" },
  "heartbeat": { "status": 0, "time": "2024-01-01T00:00:00Z" },
  "msg": "DOWN"
}
```

## 5. WebSocket 이벤트
- 경로: `/ws`
- 이벤트 타입:
  - `ticket.created`
  - `ticket.updated`
  - `host.status.changed`
  - `alert.created`

## 6. 오류 코드
| Code | 설명 |
|---|---|
| UNAUTHORIZED | 인증 실패 |
| FORBIDDEN | 권한 없음 |
| HOST_NOT_FOUND | 호스트 없음 |
| TICKET_NOT_FOUND | 티켓 없음 |
| INVALID_STATUS | 상태 전이 불가 |
