package com.kohub.adapter;

/**
 * 어댑터 기능
 */
public enum AdapterCapability {
    /**
     * Webhook 수신 가능
     */
    WEBHOOK_RECEIVE,
    
    /**
     * 상태 조회 가능
     */
    STATUS_QUERY,
    
    /**
     * 액션 실행 가능
     */
    ACTION_EXECUTE,
    
    /**
     * 로그 수집 가능
     */
    LOG_COLLECT,
    
    /**
     * 양방향 동기화 가능
     */
    BIDIRECTIONAL_SYNC
}
