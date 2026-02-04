package com.kohub.domain.ticket.entity;

/**
 * 티켓 우선순위
 */
public enum TicketPriority {
    /** 심각 - 서비스 전면 장애 */
    CRITICAL,
    
    /** 높음 - 주요 기능 장애 */
    HIGH,
    
    /** 중간 - 일부 기능 장애 */
    MEDIUM,
    
    /** 낮음 - 경미한 이슈 */
    LOW
}
