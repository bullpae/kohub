package com.kohub.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

/**
 * API 응답 공통 래퍼
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    
    private final T data;
    private final ErrorInfo error;
    private final Meta meta;

    @Getter
    @Builder
    public static class Meta {
        @Builder.Default
        private final String timestamp = Instant.now().toString();
        @Builder.Default
        private final String requestId = UUID.randomUUID().toString();
    }

    @Getter
    @Builder
    public static class ErrorInfo {
        private final String code;
        private final String message;
        private final Object details;
    }

    /**
     * 성공 응답 생성
     */
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .data(data)
                .meta(Meta.builder().build())
                .build();
    }

    /**
     * 에러 응답 생성
     */
    public static <T> ApiResponse<T> error(String code, String message) {
        return ApiResponse.<T>builder()
                .error(ErrorInfo.builder()
                        .code(code)
                        .message(message)
                        .build())
                .meta(Meta.builder().build())
                .build();
    }

    /**
     * 에러 응답 생성 (상세 정보 포함)
     */
    public static <T> ApiResponse<T> error(String code, String message, Object details) {
        return ApiResponse.<T>builder()
                .error(ErrorInfo.builder()
                        .code(code)
                        .message(message)
                        .details(details)
                        .build())
                .meta(Meta.builder().build())
                .build();
    }
}
