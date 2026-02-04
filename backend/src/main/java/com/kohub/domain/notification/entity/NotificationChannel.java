package com.kohub.domain.notification.entity;

/**
 * 알림 채널
 */
public enum NotificationChannel {
    /** 이메일 */
    EMAIL,
    /** Slack */
    SLACK,
    /** Microsoft Teams */
    TEAMS,
    /** 웹 푸시 */
    WEB_PUSH,
    /** 인앱 알림 */
    IN_APP
}
