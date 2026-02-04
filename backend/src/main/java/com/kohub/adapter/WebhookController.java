package com.kohub.adapter;

import com.kohub.adapter.uptime.UptimeKumaAdapter;
import com.kohub.common.response.ApiResponse;
import com.kohub.domain.host.service.HostAdapterService;
import com.kohub.domain.ticket.dto.TicketResponse;
import com.kohub.domain.ticket.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Webhook 수신 컨트롤러
 */
@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final Map<String, ToolAdapter> adapters;
    private final TicketService ticketService;
    private final HostAdapterService hostAdapterService;

    /**
     * Uptime Kuma Webhook 수신
     * - Monitor ID로 호스트 자동 매핑
     */
    @PostMapping("/uptime-kuma")
    public ResponseEntity<ApiResponse<WebhookResult>> handleUptimeKuma(
            @RequestBody String payload,
            @RequestHeader Map<String, String> headers) {
        
        log.info("Uptime Kuma Webhook 수신");
        log.debug("Payload: {}", payload);
        
        UptimeKumaAdapter adapter = (UptimeKumaAdapter) adapters.get(UptimeKumaAdapter.ADAPTER_NAME);
        if (adapter == null) {
            log.error("uptime-kuma 어댑터를 찾을 수 없습니다");
            return ResponseEntity.ok(ApiResponse.success(
                    new WebhookResult(false, "Adapter not found", null, null)));
        }
        
        // Monitor ID로 호스트 매핑 시도
        Optional<String> monitorIdOpt = adapter.extractMonitorId(payload);
        UUID hostId = null;
        
        if (monitorIdOpt.isPresent()) {
            String monitorId = monitorIdOpt.get();
            hostId = hostAdapterService
                    .findHostIdByExternalId(UptimeKumaAdapter.ADAPTER_NAME, monitorId)
                    .orElse(null);
            
            if (hostId != null) {
                log.info("Uptime Kuma Monitor {} → Host {} 매핑됨", monitorId, hostId);
            } else {
                log.warn("Uptime Kuma Monitor {}에 매핑된 호스트 없음", monitorId);
            }
        }
        
        // 호스트 매핑 포함하여 티켓 생성
        final UUID finalHostId = hostId;
        return adapter.handleWebhookWithHostMapping(payload, finalHostId)
                .map(request -> {
                    TicketResponse ticket = ticketService.create(request, null);
                    log.info("Webhook으로 티켓 생성 완료: ticketId={}, hostId={}", 
                            ticket.getId(), finalHostId);
                    return ResponseEntity.ok(ApiResponse.success(
                            new WebhookResult(true, "Ticket created", 
                                    ticket.getId().toString(), 
                                    finalHostId != null ? finalHostId.toString() : null)));
                })
                .orElseGet(() -> {
                    log.info("Webhook 처리됨 (티켓 생성 없음)");
                    return ResponseEntity.ok(ApiResponse.success(
                            new WebhookResult(true, "Processed (no ticket created)", null, null)));
                });
    }

    /**
     * Prometheus Alertmanager Webhook 수신
     */
    @PostMapping("/prometheus")
    public ResponseEntity<ApiResponse<WebhookResult>> handlePrometheus(
            @RequestBody String payload,
            @RequestHeader Map<String, String> headers) {
        
        log.info("Prometheus Alertmanager Webhook 수신");
        log.debug("Payload: {}", payload);
        
        ToolAdapter adapter = adapters.get("prometheus");
        if (adapter == null) {
            log.error("prometheus 어댑터를 찾을 수 없습니다");
            return ResponseEntity.ok(ApiResponse.success(
                    new WebhookResult(false, "Adapter not found", null, null)));
        }
        
        return adapter.handleWebhook(payload, headers)
                .map(request -> {
                    TicketResponse ticket = ticketService.create(request, null);
                    log.info("Prometheus Alert으로 티켓 생성: ticketId={}", ticket.getId());
                    return ResponseEntity.ok(ApiResponse.success(
                            new WebhookResult(true, "Ticket created from Prometheus alert", 
                                    ticket.getId().toString(), null)));
                })
                .orElseGet(() -> {
                    log.info("Prometheus Webhook 처리됨 (티켓 생성 없음 - resolved 또는 무시됨)");
                    return ResponseEntity.ok(ApiResponse.success(
                            new WebhookResult(true, "Processed (no ticket created)", null, null)));
                });
    }

    /**
     * Webhook 처리 결과
     */
    public record WebhookResult(
            boolean processed,
            String message,
            String ticketId,
            String hostId
    ) {}
}
