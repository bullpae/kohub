package com.kohub.domain.organization.dto;

import com.kohub.domain.organization.entity.Organization;
import com.kohub.domain.organization.entity.OrganizationStatus;
import com.kohub.domain.organization.entity.OrganizationType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 조직 응답 DTO
 */
@Getter
@Builder
public class OrganizationResponse {
    private final UUID id;
    private final String name;
    private final String code;
    private final String description;
    private final UUID parentId;
    private final OrganizationType type;
    private final OrganizationStatus status;
    private final UUID managerId;
    private final String phone;
    private final String email;
    private final LocalDateTime createdAt;

    public static OrganizationResponse from(Organization org) {
        return OrganizationResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .code(org.getCode())
                .description(org.getDescription())
                .parentId(org.getParentId())
                .type(org.getType())
                .status(org.getStatus())
                .managerId(org.getManagerId())
                .phone(org.getPhone())
                .email(org.getEmail())
                .createdAt(org.getCreatedAt())
                .build();
    }

    /**
     * 간략 정보 (목록용)
     */
    @Getter
    @Builder
    public static class Summary {
        private final UUID id;
        private final String name;
        private final String code;
        private final OrganizationType type;

        public static Summary from(Organization org) {
            if (org == null) return null;
            return Summary.builder()
                    .id(org.getId())
                    .name(org.getName())
                    .code(org.getCode())
                    .type(org.getType())
                    .build();
        }
    }
}
