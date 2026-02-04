package com.kohub.domain.organization.dto;

import com.kohub.domain.organization.entity.OrganizationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * 조직 생성/수정 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationRequest {

    @NotBlank(message = "조직명은 필수입니다")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "조직 코드는 필수입니다")
    @Size(max = 20)
    private String code;

    @Size(max = 500)
    private String description;

    private UUID parentId;

    private OrganizationType type;

    private UUID managerId;

    @Size(max = 20)
    private String phone;

    @Size(max = 100)
    private String email;
}
