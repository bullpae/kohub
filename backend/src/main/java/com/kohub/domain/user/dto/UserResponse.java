package com.kohub.domain.user.dto;

import com.kohub.domain.user.entity.User;
import com.kohub.domain.user.entity.UserRole;
import com.kohub.domain.user.entity.UserStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 사용자 응답 DTO
 */
@Getter
@Builder
public class UserResponse {
    private final UUID id;
    private final String keycloakId;
    private final String email;
    private final String name;
    private final String displayName;
    private final UUID organizationId;
    private final UserRole role;
    private final UserStatus status;
    private final LocalDateTime lastLoginAt;
    private final LocalDateTime createdAt;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .keycloakId(user.getKeycloakId())
                .email(user.getEmail())
                .name(user.getName())
                .displayName(user.getDisplayName())
                .organizationId(user.getOrganizationId())
                .role(user.getRole())
                .status(user.getStatus())
                .lastLoginAt(user.getLastLoginAt())
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * 간략한 사용자 정보 (티켓 목록 등에서 사용)
     */
    @Getter
    @Builder
    public static class Summary {
        private final UUID id;
        private final String name;
        private final String email;

        public static Summary from(User user) {
            if (user == null) return null;
            return Summary.builder()
                    .id(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .build();
        }
    }
}
