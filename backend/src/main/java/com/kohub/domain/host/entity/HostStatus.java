package com.kohub.domain.host.entity;

/**
 * 호스트 상태
 */
public enum HostStatus {
    /** 활성 - 정상 운영 중 */
    ACTIVE,
    
    /** 비활성 - 운영 중지 */
    INACTIVE,
    
    /** 점검 중 */
    MAINTENANCE
}
