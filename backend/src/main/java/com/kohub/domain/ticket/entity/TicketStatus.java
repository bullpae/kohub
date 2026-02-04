package com.kohub.domain.ticket.entity;

import java.util.Set;

/**
 * 티켓 상태
 * 
 * 상태 전이 규칙:
 * NEW → RECEIVED → ASSIGNED → IN_PROGRESS → PENDING/RESOLVED
 * RESOLVED → COMPLETED → CLOSED
 * COMPLETED → REOPENED → RECEIVED
 */
public enum TicketStatus {
    /** 신규 - 티켓 생성됨 */
    NEW,
    
    /** 접수 - 접수 완료 */
    RECEIVED,
    
    /** 배정 - 담당자 배정됨 */
    ASSIGNED,
    
    /** 진행중 - 처리 중 */
    IN_PROGRESS,
    
    /** 보류 - 고객 확인 또는 외부 대기 */
    PENDING,
    
    /** 해결 - 처리 완료, 고객 확인 대기 */
    RESOLVED,
    
    /** 완료 - 고객 확인 완료 */
    COMPLETED,
    
    /** 종료 - 최종 종료 */
    CLOSED,
    
    /** 재오픈 - 완료 후 재오픈 */
    REOPENED;

    private static final Set<TicketStatus> FROM_NEW = Set.of(RECEIVED, CLOSED);
    private static final Set<TicketStatus> FROM_RECEIVED = Set.of(ASSIGNED);
    private static final Set<TicketStatus> FROM_ASSIGNED = Set.of(IN_PROGRESS);
    private static final Set<TicketStatus> FROM_IN_PROGRESS = Set.of(PENDING, RESOLVED);
    private static final Set<TicketStatus> FROM_PENDING = Set.of(IN_PROGRESS, RESOLVED);
    private static final Set<TicketStatus> FROM_RESOLVED = Set.of(COMPLETED, REOPENED);
    private static final Set<TicketStatus> FROM_COMPLETED = Set.of(CLOSED, REOPENED);
    private static final Set<TicketStatus> FROM_REOPENED = Set.of(RECEIVED);
    private static final Set<TicketStatus> FROM_CLOSED = Set.of();

    /**
     * 상태 전이 가능 여부 확인
     */
    public boolean canTransitionTo(TicketStatus to) {
        return switch (this) {
            case NEW -> FROM_NEW.contains(to);
            case RECEIVED -> FROM_RECEIVED.contains(to);
            case ASSIGNED -> FROM_ASSIGNED.contains(to);
            case IN_PROGRESS -> FROM_IN_PROGRESS.contains(to);
            case PENDING -> FROM_PENDING.contains(to);
            case RESOLVED -> FROM_RESOLVED.contains(to);
            case COMPLETED -> FROM_COMPLETED.contains(to);
            case REOPENED -> FROM_REOPENED.contains(to);
            case CLOSED -> FROM_CLOSED.contains(to);
        };
    }
}
