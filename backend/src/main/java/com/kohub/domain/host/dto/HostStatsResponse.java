package com.kohub.domain.host.dto;

import lombok.Builder;
import lombok.Getter;

/**
 * 호스트 통계 응답 DTO
 */
@Getter
@Builder
public class HostStatsResponse {
    private final long total;
    private final long active;
    private final long inactive;
    private final long maintenance;
    
    public static HostStatsResponse of(long total, long active, long inactive, long maintenance) {
        return HostStatsResponse.builder()
                .total(total)
                .active(active)
                .inactive(inactive)
                .maintenance(maintenance)
                .build();
    }
}
