package com.kohub.domain.host.dto;

import com.kohub.domain.host.entity.ConnectionType;
import com.kohub.domain.host.entity.Host;
import com.kohub.domain.host.entity.HostStatus;
import com.kohub.domain.host.entity.SshConfig;
import lombok.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * 호스트 응답 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HostResponse {

    private UUID id;
    private String name;
    private String description;
    private ConnectionType connectionType;
    private SshConfigResponse sshConfig;
    private List<String> tags;
    private HostStatus status;
    private UUID organizationId;
    private Instant createdAt;
    private Instant updatedAt;

    /**
     * SSH 설정 응답 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SshConfigResponse {
        private String host;
        private Integer port;
        private String username;

        public static SshConfigResponse from(SshConfig config) {
            if (config == null) return null;
            return SshConfigResponse.builder()
                    .host(config.getHost())
                    .port(config.getPort())
                    .username(config.getUsername())
                    .build();
        }
    }

    /**
     * Entity -> DTO 변환
     */
    public static HostResponse from(Host host) {
        return HostResponse.builder()
                .id(host.getId())
                .name(host.getName())
                .description(host.getDescription())
                .connectionType(host.getConnectionType())
                .sshConfig(SshConfigResponse.from(host.getSshConfig()))
                .tags(host.getTags())
                .status(host.getStatus())
                .organizationId(host.getOrganizationId())
                .createdAt(host.getCreatedAt())
                .updatedAt(host.getUpdatedAt())
                .build();
    }
}
