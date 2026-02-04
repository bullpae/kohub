package com.kohub.adapter.uptime;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kohub.adapter.AdapterCapability;
import com.kohub.adapter.AdapterType;
import com.kohub.adapter.ToolAdapter;
import com.kohub.domain.ticket.dto.TicketRequest;
import com.kohub.domain.ticket.entity.TicketPriority;
import com.kohub.domain.ticket.entity.TicketSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Uptime Kuma 모니터링 어댑터
 * 
 * Webhook으로 장애/복구 알림을 수신하여 티켓으로 변환
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UptimeKumaAdapter implements ToolAdapter {

    public static final String ADAPTER_NAME = "uptime-kuma";
    
    private final ObjectMapper objectMapper;

    @Override
    public String getName() {
        return ADAPTER_NAME;
    }

    @Override
    public AdapterType getType() {
        return AdapterType.MONITORING;
    }

    @Override
    public AdapterCapability[] getCapabilities() {
        return new AdapterCapability[]{
                AdapterCapability.WEBHOOK_RECEIVE,
                AdapterCapability.STATUS_QUERY
        };
    }

    @Override
    public Optional<TicketRequest> handleWebhook(String payload, Map<String, String> headers) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            return handleWebhookInternal(root, null);
        } catch (Exception e) {
            log.error("Uptime Kuma Webhook 파싱 실패: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }
    
    /**
     * Webhook 처리 (호스트 ID 매핑 포함)
     */
    public Optional<TicketRequest> handleWebhookWithHostMapping(String payload, UUID hostId) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            return handleWebhookInternal(root, hostId);
        } catch (Exception e) {
            log.error("Uptime Kuma Webhook 파싱 실패: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }
    
    private Optional<TicketRequest> handleWebhookInternal(JsonNode root, UUID hostId) {
        // Uptime Kuma Webhook 페이로드 파싱
        JsonNode monitor = root.path("monitor");
        JsonNode heartbeat = root.path("heartbeat");
        String msg = root.path("msg").asText("");
        
        String monitorName = monitor.path("name").asText("Unknown");
        int monitorId = monitor.path("id").asInt(0);
        String monitorUrl = monitor.path("url").asText("");
        
        int status = heartbeat.path("status").asInt(1);
        String time = heartbeat.path("time").asText(Instant.now().toString());
        String statusMsg = heartbeat.path("msg").asText("");
        
        // status: 0 = DOWN, 1 = UP, 2 = PENDING
        if (status == 1) {
            log.info("Uptime Kuma 복구 알림 수신: monitor={}", monitorName);
            // UP 상태는 기존 티켓 해결 처리로 연결 (TODO: 자동 해결 구현)
            return Optional.empty();
        }
        
        if (status != 0) {
            log.debug("Uptime Kuma 상태: status={} (무시)", status);
            return Optional.empty();
        }
        
        // DOWN 상태 - 티켓 생성
        String title = String.format("[장애] %s - %s", monitorName, truncate(statusMsg, 50));
        String description = buildDescription(monitorName, monitorUrl, time, statusMsg, msg);
        String sourceEventId = String.format("uptime-kuma-%d-%s", monitorId, 
                time.replaceAll("[^0-9T]", "").substring(0, Math.min(15, time.length())));
        
        TicketRequest request = TicketRequest.builder()
                .title(title)
                .description(description)
                .source(TicketSource.UPTIME_KUMA)
                .sourceEventId(sourceEventId)
                .priority(TicketPriority.CRITICAL)
                .hostId(hostId)  // 호스트 ID 자동 매핑
                .build();
        
        log.info("Uptime Kuma 장애 알림 → 티켓 생성 요청: monitor={}, eventId={}, hostId={}", 
                monitorName, sourceEventId, hostId);
        
        return Optional.of(request);
    }
    
    /**
     * Webhook 페이로드에서 Monitor ID 추출
     */
    public Optional<String> extractMonitorId(String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            int monitorId = root.path("monitor").path("id").asInt(0);
            return monitorId > 0 ? Optional.of(String.valueOf(monitorId)) : Optional.empty();
        } catch (Exception e) {
            log.error("Monitor ID 추출 실패: {}", e.getMessage());
            return Optional.empty();
        }
    }

    @Override
    public boolean isHealthy() {
        // TODO: Uptime Kuma API 연결 상태 확인
        return true;
    }
    
    private String buildDescription(String monitorName, String url, String time, 
                                     String statusMsg, String msg) {
        StringBuilder sb = new StringBuilder();
        sb.append("## Uptime Kuma 모니터링 알림\n\n");
        sb.append("| 항목 | 값 |\n");
        sb.append("|------|------|\n");
        sb.append(String.format("| 모니터 | %s |\n", monitorName));
        if (url != null && !url.isEmpty()) {
            sb.append(String.format("| URL | %s |\n", url));
        }
        sb.append(String.format("| 상태 | DOWN |\n"));
        sb.append(String.format("| 시간 | %s |\n", time));
        sb.append(String.format("| 메시지 | %s |\n", statusMsg));
        
        if (msg != null && !msg.isEmpty()) {
            sb.append("\n### 상세\n");
            sb.append(msg);
        }
        
        return sb.toString();
    }
    
    private String truncate(String str, int maxLen) {
        if (str == null) return "";
        return str.length() > maxLen ? str.substring(0, maxLen) + "..." : str;
    }
}
