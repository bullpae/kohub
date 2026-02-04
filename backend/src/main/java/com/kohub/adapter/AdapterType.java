package com.kohub.adapter;

/**
 * 어댑터 유형
 */
public enum AdapterType {
    /**
     * 모니터링 (Uptime Kuma, Prometheus)
     */
    MONITORING,
    
    /**
     * 터미널 (Termix)
     */
    TERMINAL,
    
    /**
     * 자동화 (Ansible) - Phase 3
     */
    AUTOMATION,
    
    /**
     * 알림 (Slack, Teams) - Phase 2
     */
    NOTIFICATION
}
