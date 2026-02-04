package com.kohub.domain.host.dto;

import com.kohub.domain.host.entity.ConnectionType;
import com.kohub.domain.host.entity.SshConfig;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.util.List;
import java.util.UUID;

/**
 * 호스트 생성/수정 요청 DTO
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HostRequest {

    @NotBlank(message = "호스트 이름은 필수입니다")
    @Size(max = 100, message = "호스트 이름은 100자 이하여야 합니다")
    private String name;

    @Size(max = 500, message = "설명은 500자 이하여야 합니다")
    private String description;

    @Builder.Default
    private ConnectionType connectionType = ConnectionType.SSH;

    private SshConfigRequest sshConfig;

    private List<String> tags;

    private UUID organizationId;

    /**
     * SSH 설정 DTO
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SshConfigRequest {
        private String host;
        
        @Builder.Default
        private Integer port = 22;
        
        private String username;

        public SshConfig toEntity() {
            return SshConfig.builder()
                    .host(host)
                    .port(port)
                    .username(username)
                    .build();
        }
    }
}
