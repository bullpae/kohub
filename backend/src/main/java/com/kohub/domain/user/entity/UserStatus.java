package com.kohub.domain.user.entity;

/**
 * 사용자 상태
 */
public enum UserStatus {
    /**
     * 활성 - 정상 사용 가능
     */
    ACTIVE,
    
    /**
     * 비활성 - 로그인 불가
     */
    INACTIVE,
    
    /**
     * 대기 - 승인 대기 중
     */
    PENDING
}
