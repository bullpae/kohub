# kohub 어댑터 명세

## 1. 목적
외부 도구 이벤트를 kohub 표준 모델로 변환하고, 상태 조회/액션 실행을 통합한다.

## 2. 공통 인터페이스
```java
public interface ToolAdapter {
    String getName();
    AdapterType getType();
    TicketCreateRequest handleWebhook(String payload);
    HostStatus getStatus(String hostId);
    ActionResult executeAction(String action, Map<String, Object> params);
}

public enum AdapterType {
    MONITORING, TERMINAL, AUTOMATION, NOTIFICATION
}
```

## 3. 표준 이벤트 모델
### 3.1 TicketCreateRequest
```json
{
  "title": "서버 다운",
  "description": "web-prod-01 다운",
  "source": "UPTIME_KUMA",
  "priority": "CRITICAL",
  "hostId": "uuid",
  "externalEventId": "uptime-123"
}
```

### 3.2 HostStatus
```json
{
  "hostId": "uuid",
  "status": "DOWN",
  "checkedAt": "2024-01-01T00:00:00Z",
  "raw": { "...": "..." }
}
```

## 4. 어댑터별 명세
### 4.1 Uptime Kuma (MONITORING)
- Webhook 수신 → TicketCreateRequest 변환
- 상태 값 매핑
  - `status=0` → DOWN
  - `status=1` → UP
- 중복 이벤트 방지: 동일 `externalEventId`는 10분 내 중복 처리 금지

### 4.2 Termix (TERMINAL)
- Host별 터미널 URL 생성
- 세션 로그 조회 API 제공
- 인증: Keycloak 토큰 전달 또는 API Key 기반

### 4.3 Prometheus (MONITORING) - Phase 2
- Alertmanager Webhook 수신
- 라벨 기반 host 매핑

### 4.4 Slack/Teams (NOTIFICATION) - Phase 2
- 티켓 상태 변경 시 알림 전송
- 채널/템플릿 매핑 설정 제공

## 5. 오류 처리
- 외부 API 장애 시 재시도 (exponential backoff)
- 실패 이벤트는 dead-letter 큐에 저장
- 어댑터별 상태 헬스 체크 제공

## 6. 보안
- Webhook 시그니처 검증(가능한 경우)
- 민감 정보는 Vault/환경변수로 관리
