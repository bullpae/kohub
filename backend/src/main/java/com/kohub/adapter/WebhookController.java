package com.kohub.adapter;

import com.kohub.common.response.ApiResponse;
import com.kohub.domain.ticket.dto.TicketResponse;
import com.kohub.domain.ticket.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

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

    /**
     * Uptime Kuma Webhook 수신
     */
    @PostMapping("/uptime-kuma")
    public ResponseEntity<ApiResponse<WebhookResult>> handleUptimeKuma(
            @RequestBody String payload,
            @RequestHeader Map<String, String> headers) {
        
        log.info("Uptime Kuma Webhook 수신");
        log.debug("Payload: {}", payload);
        
        ToolAdapter adapter = adapters.get("uptime-kuma");
        if (adapter == null) {
            log.error("uptime-kuma 어댑터를 찾을 수 없습니다");
            return ResponseEntity.ok(ApiResponse.success(
                    new WebhookResult(false, "Adapter not found", null)));
        }
        
        return adapter.handleWebhook(payload, headers)
                .map(request -> {
                    // 티켓 생성 (reporterId는 시스템으로 설정)
                    TicketResponse ticket = ticketService.create(request, null);
                    log.info("Webhook으로 티켓 생성 완료: ticketId={}", ticket.getId());
                    return ResponseEntity.ok(ApiResponse.success(
                            new WebhookResult(true, "Ticket created", ticket.getId().toString())));
                })
                .orElseGet(() -> {
                    log.info("Webhook 처리됨 (티켓 생성 없음)");
                    return ResponseEntity.ok(ApiResponse.success(
                            new WebhookResult(true, "Processed (no ticket created)", null)));
                });
    }

    /**
     * Prometheus Alertmanager Webhook 수신 (Phase 2)
     */
    @PostMapping("/prometheus")
    public ResponseEntity<ApiResponse<WebhookResult>> handlePrometheus(
            @RequestBody String payload,
            @RequestHeader Map<String, String> headers) {
        
        log.info("Prometheus Webhook 수신 (Phase 2에서 구현 예정)");
        return ResponseEntity.ok(ApiResponse.success(
                new WebhookResult(true, "Not implemented yet", null)));
    }

    /**
     * Webhook 처리 결과
     */
    public record WebhookResult(
            boolean processed,
            String message,
            String ticketId
    ) {}
}
