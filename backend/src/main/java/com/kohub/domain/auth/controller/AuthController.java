package com.kohub.domain.auth.controller;

import com.kohub.domain.auth.dto.ChangePasswordRequest;
import com.kohub.domain.auth.dto.LoginRequest;
import com.kohub.domain.auth.dto.LoginResponse;
import com.kohub.domain.auth.dto.RefreshTokenRequest;
import com.kohub.domain.auth.service.KeycloakAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 인증 API 컨트롤러
 * - POST /api/v1/auth/login           : 아이디/비밀번호 로그인
 * - POST /api/v1/auth/change-password : 비밀번호 변경 (초기 비밀번호 변경)
 * - POST /api/v1/auth/refresh         : 토큰 갱신
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final KeycloakAuthService keycloakAuthService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        try {
            LoginResponse response = keycloakAuthService.login(request.getUsername(), request.getPassword());
            // passwordChangeRequired인 경우에도 200으로 반환 (프론트에서 분기 처리)
            if (response.isPasswordChangeRequired()) {
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.warn("로그인 실패: {}", e.getMessage());
            LoginResponse errorResponse = LoginResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.status(401).body(errorResponse);
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<LoginResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        try {
            LoginResponse response = keycloakAuthService.changePassword(
                    request.getUsername(),
                    request.getCurrentPassword(),
                    request.getNewPassword()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.warn("비밀번호 변경 실패: {}", e.getMessage());
            LoginResponse errorResponse = LoginResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.status(400).body(errorResponse);
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        try {
            LoginResponse response = keycloakAuthService.refreshToken(request.getRefreshToken());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.warn("토큰 갱신 실패: {}", e.getMessage());
            LoginResponse errorResponse = LoginResponse.builder()
                    .success(false)
                    .message(e.getMessage())
                    .build();
            return ResponseEntity.status(401).body(errorResponse);
        }
    }
}
