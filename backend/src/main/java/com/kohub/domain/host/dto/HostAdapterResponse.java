package com.kohub.domain.host.dto;

import com.kohub.domain.host.entity.HostAdapter;
import com.kohub.domain.host.entity.HostAdapterStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * 호스트 어댑터 응답 DTO
 */
@Getter
@Builder
public class HostAdapterResponse {
    private final UUID id;
    private final UUID hostId;
    private final String hostName;
    private final String adapterType;
    private final String externalId;
    private final Map<String, Object> config;
    private final HostAdapterStatus status;
    private final LocalDateTime lastSyncAt;
    private final String errorMessage;
    private final LocalDateTime createdAt;

    public static HostAdapterResponse from(HostAdapter adapter) {
        return HostAdapterResponse.builder()
                .id(adapter.getId())
                .hostId(adapter.getHost().getId())
                .hostName(adapter.getHost().getName())
                .adapterType(adapter.getAdapterType())
                .externalId(adapter.getExternalId())
                .config(adapter.getConfig())
                .status(adapter.getStatus())
                .lastSyncAt(adapter.getLastSyncAt())
                .errorMessage(adapter.getErrorMessage())
                .createdAt(adapter.getCreatedAt())
                .build();
    }

    /**
     * 간략 정보 (호스트 상세에서 사용)
     */
    @Getter
    @Builder
    public static class Summary {
        private final UUID id;
        private final String adapterType;
        private final String externalId;
        private final HostAdapterStatus status;
        private final LocalDateTime lastSyncAt;

        public static Summary from(HostAdapter adapter) {
            return Summary.builder()
                    .id(adapter.getId())
                    .adapterType(adapter.getAdapterType())
                    .externalId(adapter.getExternalId())
                    .status(adapter.getStatus())
                    .lastSyncAt(adapter.getLastSyncAt())
                    .build();
        }
    }
}
