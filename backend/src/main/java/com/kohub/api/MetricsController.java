package com.kohub.api;

import com.kohub.adapter.prometheus.PrometheusAdapter;
import com.kohub.common.response.ApiResponse;
import com.kohub.domain.host.entity.Host;
import com.kohub.domain.host.repository.HostRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

/**
 * 메트릭 API
 */
@RestController
@RequestMapping("/api/v1/metrics")
@RequiredArgsConstructor
@Tag(name = "Metrics", description = "모니터링 메트릭 API")
public class MetricsController {

    private final PrometheusAdapter prometheusAdapter;
    private final HostRepository hostRepository;

    /**
     * 호스트 메트릭 조회
     */
    @GetMapping("/hosts/{hostId}")
    @Operation(summary = "호스트 메트릭", description = "Prometheus에서 호스트 메트릭을 조회합니다")
    public ApiResponse<PrometheusAdapter.HostMetrics> getHostMetrics(@PathVariable UUID hostId) {
        Host host = hostRepository.findById(hostId)
                .orElseThrow(() -> new RuntimeException("호스트를 찾을 수 없습니다"));

        // SSH 설정에서 호스트 주소 추출
        String hostAddress = host.getSshConfig() != null ? 
                host.getSshConfig().getHost() + ":9100" : // node_exporter 기본 포트
                null;

        if (hostAddress == null) {
            return ApiResponse.success(null);
        }

        Optional<PrometheusAdapter.HostMetrics> metrics = prometheusAdapter.getHostMetrics(hostAddress);
        return ApiResponse.success(metrics.orElse(null));
    }

    /**
     * Prometheus 쿼리 실행
     */
    @GetMapping("/query")
    @Operation(summary = "PromQL 쿼리", description = "Prometheus 쿼리를 실행합니다")
    public ApiResponse<PrometheusAdapter.PrometheusQueryResult> query(@RequestParam String promql) {
        Optional<PrometheusAdapter.PrometheusQueryResult> result = prometheusAdapter.query(promql);
        return ApiResponse.success(result.orElse(null));
    }

    /**
     * Prometheus 상태 확인
     */
    @GetMapping("/health")
    @Operation(summary = "Prometheus 상태", description = "Prometheus 연결 상태를 확인합니다")
    public ApiResponse<HealthStatus> getHealth() {
        boolean healthy = prometheusAdapter.isHealthy();
        return ApiResponse.success(new HealthStatus(healthy, healthy ? "Connected" : "Disconnected"));
    }

    public record HealthStatus(boolean healthy, String message) {}
}
