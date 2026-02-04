package com.kohub.adapter.prometheus;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kohub.adapter.AdapterCapability;
import com.kohub.adapter.AdapterType;
import com.kohub.adapter.ToolAdapter;
import com.kohub.domain.ticket.dto.TicketRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

/**
 * Prometheus Alertmanager 어댑터
 * - Alertmanager Webhook 수신
 * - 메트릭 쿼리
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PrometheusAdapter implements ToolAdapter {

    public static final String ADAPTER_NAME = "prometheus";

    @Value("${kohub.adapters.prometheus.enabled:false}")
    private boolean enabled;

    @Value("${kohub.adapters.prometheus.base-url:http://localhost:9090}")
    private String baseUrl;

    @Value("${kohub.adapters.prometheus.alertmanager-url:http://localhost:9093}")
    private String alertmanagerUrl;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

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
            JsonNode alerts = root.get("alerts");
            
            if (alerts == null || !alerts.isArray() || alerts.isEmpty()) {
                log.debug("Prometheus Webhook: alerts 없음");
                return Optional.empty();
            }

            // 첫 번째 firing alert 처리
            for (JsonNode alert : alerts) {
                String status = alert.path("status").asText();
                if (!"firing".equals(status)) continue;

                return Optional.of(createTicketFromAlert(alert));
            }

            return Optional.empty();
        } catch (Exception e) {
            log.error("Prometheus Webhook 파싱 실패: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }

    /**
     * Alert에서 티켓 생성
     */
    private TicketRequest createTicketFromAlert(JsonNode alert) {
        JsonNode labels = alert.path("labels");
        JsonNode annotations = alert.path("annotations");

        String alertName = labels.path("alertname").asText("Unknown Alert");
        String severity = labels.path("severity").asText("warning");
        String instance = labels.path("instance").asText("");
        String job = labels.path("job").asText("");

        String summary = annotations.path("summary").asText(alertName);
        String description = annotations.path("description").asText("");

        return TicketRequest.builder()
                .title(String.format("[Prometheus] %s", summary))
                .description(buildDescription(alertName, severity, instance, job, description))
                .priority(mapSeverityToPriority(severity))
                .source(com.kohub.domain.ticket.entity.TicketSource.PROMETHEUS)
                .sourceEventId(String.format("prometheus:%s:%s", alertName, instance))
                .build();
    }

    private String buildDescription(String alertName, String severity, String instance, String job, String description) {
        StringBuilder sb = new StringBuilder();
        sb.append("## Prometheus Alert\n\n");
        sb.append(String.format("- **Alert**: %s\n", alertName));
        sb.append(String.format("- **Severity**: %s\n", severity));
        if (!instance.isEmpty()) {
            sb.append(String.format("- **Instance**: %s\n", instance));
        }
        if (!job.isEmpty()) {
            sb.append(String.format("- **Job**: %s\n", job));
        }
        if (!description.isEmpty()) {
            sb.append(String.format("\n### Description\n%s\n", description));
        }
        return sb.toString();
    }

    private com.kohub.domain.ticket.entity.TicketPriority mapSeverityToPriority(String severity) {
        return switch (severity.toLowerCase()) {
            case "critical" -> com.kohub.domain.ticket.entity.TicketPriority.CRITICAL;
            case "error", "high" -> com.kohub.domain.ticket.entity.TicketPriority.HIGH;
            case "warning" -> com.kohub.domain.ticket.entity.TicketPriority.MEDIUM;
            default -> com.kohub.domain.ticket.entity.TicketPriority.LOW;
        };
    }

    @Override
    public boolean isHealthy() {
        if (!enabled) return false;

        try {
            String url = baseUrl + "/-/healthy";
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.warn("Prometheus 상태 확인 실패: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Prometheus 쿼리 실행
     */
    public Optional<PrometheusQueryResult> query(String promQL) {
        if (!enabled) return Optional.empty();

        try {
            String url = String.format("%s/api/v1/query?query=%s", baseUrl, promQL);
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                if ("success".equals(root.path("status").asText())) {
                    return Optional.of(parseQueryResult(root.path("data")));
                }
            }
            return Optional.empty();
        } catch (Exception e) {
            log.error("Prometheus 쿼리 실패: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }

    /**
     * 호스트별 메트릭 조회
     */
    public Optional<HostMetrics> getHostMetrics(String hostAddress) {
        if (!enabled) return Optional.empty();

        try {
            // CPU 사용률
            Optional<PrometheusQueryResult> cpuResult = query(
                    String.format("100 - (avg(rate(node_cpu_seconds_total{instance=\"%s\",mode=\"idle\"}[5m])) * 100)", hostAddress));

            // 메모리 사용률
            Optional<PrometheusQueryResult> memResult = query(
                    String.format("(1 - (node_memory_MemAvailable_bytes{instance=\"%s\"} / node_memory_MemTotal_bytes{instance=\"%s\"})) * 100", hostAddress, hostAddress));

            // 디스크 사용률
            Optional<PrometheusQueryResult> diskResult = query(
                    String.format("(1 - (node_filesystem_avail_bytes{instance=\"%s\",mountpoint=\"/\"} / node_filesystem_size_bytes{instance=\"%s\",mountpoint=\"/\"})) * 100", hostAddress, hostAddress));

            return Optional.of(HostMetrics.builder()
                    .cpuUsage(cpuResult.map(r -> r.getValue()).orElse(0.0))
                    .memoryUsage(memResult.map(r -> r.getValue()).orElse(0.0))
                    .diskUsage(diskResult.map(r -> r.getValue()).orElse(0.0))
                    .timestamp(LocalDateTime.now())
                    .build());

        } catch (Exception e) {
            log.error("호스트 메트릭 조회 실패: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }

    private PrometheusQueryResult parseQueryResult(JsonNode data) {
        String resultType = data.path("resultType").asText();
        JsonNode result = data.path("result");

        if (result.isArray() && !result.isEmpty()) {
            JsonNode firstResult = result.get(0);
            JsonNode value = firstResult.path("value");

            if (value.isArray() && value.size() >= 2) {
                double timestamp = value.get(0).asDouble();
                double val = value.get(1).asDouble();

                return PrometheusQueryResult.builder()
                        .resultType(resultType)
                        .value(val)
                        .timestamp(LocalDateTime.ofInstant(
                                Instant.ofEpochSecond((long) timestamp),
                                ZoneId.systemDefault()))
                        .build();
            }
        }

        return PrometheusQueryResult.builder()
                .resultType(resultType)
                .value(0.0)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Prometheus 쿼리 결과
     */
    @lombok.Builder
    @lombok.Getter
    public static class PrometheusQueryResult {
        private String resultType;
        private double value;
        private LocalDateTime timestamp;
    }

    /**
     * 호스트 메트릭
     */
    @lombok.Builder
    @lombok.Getter
    public static class HostMetrics {
        private double cpuUsage;
        private double memoryUsage;
        private double diskUsage;
        private LocalDateTime timestamp;
    }
}
