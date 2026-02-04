package com.kohub.domain.ticket.entity;

/**
 * 티켓 생성 소스
 */
public enum TicketSource {
    /** 수동 생성 */
    MANUAL,
    
    /** Uptime Kuma 모니터링 */
    UPTIME_KUMA,
    
    /** Prometheus 알림 */
    PROMETHEUS,
    
    /** 고객 요청 (KustHub 연계) */
    CUSTOMER_REQUEST
}
