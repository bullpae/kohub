package com.kohub.domain.host.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 호스트 어댑터 생성/수정 요청 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HostAdapterRequest {

    @NotBlank(message = "어댑터 타입은 필수입니다")
    @Size(max = 30)
    private String adapterType;

    @Size(max = 100)
    private String externalId;

    private Map<String, Object> config;
}
