package com.kohub.domain.host.entity;

/**
 * 호스트 어댑터 상태
 */
public enum HostAdapterStatus {
    /**
     * 활성 - 정상 동작
     */
    ACTIVE,
    
    /**
     * 비활성 - 연동 중지
     */
    INACTIVE,
    
    /**
     * 오류 - 연동 실패
     */
    ERROR
}
