package com.kohub.common.security;

import lombok.Builder;
import lombok.Getter;

import java.util.Set;
import java.util.UUID;

/**
 * 인증된 사용자 정보
 */
@Getter
@Builder
public class AuthenticatedUser {
    
    /**
     * kohub 내부 사용자 ID (동기화 후)
     */
    private final UUID userId;
    
    /**
     * Keycloak 사용자 ID (sub claim)
     */
    private final String keycloakId;
    
    /**
     * 이메일
     */
    private final String email;
    
    /**
     * 이름
     */
    private final String name;
    
    /**
     * 역할 목록
     */
    private final Set<String> roles;
    
    /**
     * 특정 역할 보유 여부
     */
    public boolean hasRole(String role) {
        return roles != null && roles.contains(role.toUpperCase());
    }
    
    /**
     * 관리자 여부
     */
    public boolean isAdmin() {
        return hasRole("ADMIN");
    }
    
    /**
     * 운영자 이상 여부
     */
    public boolean isOperator() {
        return hasRole("ADMIN") || hasRole("OPERATOR");
    }
}
