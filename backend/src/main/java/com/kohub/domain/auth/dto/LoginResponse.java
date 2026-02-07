package com.kohub.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private boolean success;
    private String message;
    private String accessToken;
    private String refreshToken;
    private long expiresIn;
    private String tokenType;
    /** 비밀번호 변경이 필요한 경우 true */
    @Builder.Default
    private boolean passwordChangeRequired = false;
}
