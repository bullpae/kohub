package com.kohub.domain.notification.entity;

/**
 * 알림 상태
 */
public enum NotificationStatus {
    /** 대기 중 */
    PENDING,
    /** 전송됨 */
    SENT,
    /** 읽음 */
    READ,
    /** 전송 실패 */
    FAILED,
    /** 취소됨 */
    CANCELLED
}
