package com.kohub.domain.notification.entity;

/**
 * 알림 유형
 */
public enum NotificationType {
    /** 티켓 생성 */
    TICKET_CREATED,
    /** 티켓 상태 변경 */
    TICKET_STATUS_CHANGED,
    /** 티켓 담당자 배정 */
    TICKET_ASSIGNED,
    /** 티켓 우선순위 변경 */
    TICKET_PRIORITY_CHANGED,
    /** 티켓 코멘트 추가 */
    TICKET_COMMENTED,
    /** 호스트 장애 감지 */
    HOST_DOWN,
    /** 호스트 복구 */
    HOST_UP,
    /** 호스트 상태 변경 */
    HOST_STATUS_CHANGED,
    /** 시스템 알림 */
    SYSTEM_ALERT
}
