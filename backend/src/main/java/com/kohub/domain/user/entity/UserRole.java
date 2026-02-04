package com.kohub.domain.user.entity;

/**
 * 사용자 역할 (Keycloak 역할과 매핑)
 */
public enum UserRole {
    /**
     * 시스템 관리자 - 전체 시스템 관리 권한
     */
    ADMIN,
    
    /**
     * MSP 운영자 - 장애 대응, 티켓 처리
     */
    OPERATOR,
    
    /**
     * 일반 사용자 - 읽기 권한
     */
    MEMBER,
    
    /**
     * 고객사 관리자 - 고객사 조직 관리
     */
    CUSTOMER_ADMIN,
    
    /**
     * 고객 - 티켓 요청
     */
    CUSTOMER;

    /**
     * Keycloak 역할 문자열에서 변환
     */
    public static UserRole fromKeycloakRole(String keycloakRole) {
        if (keycloakRole == null) {
            return MEMBER;
        }
        
        return switch (keycloakRole.toLowerCase()) {
            case "msp-admin", "admin" -> ADMIN;
            case "msp-operator", "operator" -> OPERATOR;
            case "customer-admin" -> CUSTOMER_ADMIN;
            case "customer" -> CUSTOMER;
            default -> MEMBER;
        };
    }

    /**
     * 운영자 이상 권한 여부
     */
    public boolean isOperatorOrAbove() {
        return this == ADMIN || this == OPERATOR;
    }

    /**
     * 관리자 권한 여부
     */
    public boolean isAdmin() {
        return this == ADMIN;
    }
}
