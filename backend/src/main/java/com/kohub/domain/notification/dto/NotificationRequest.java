package com.kohub.domain.notification.dto;

import com.kohub.domain.notification.entity.NotificationChannel;
import com.kohub.domain.notification.entity.NotificationType;
import lombok.Builder;
import lombok.Getter;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 알림 생성 요청
 */
@Getter
@Builder
public class NotificationRequest {

    /**
     * 수신자 ID 목록
     */
    private Set<UUID> recipientIds;

    /**
     * 알림 유형
     */
    private NotificationType type;

    /**
     * 알림 채널들
     */
    private Set<NotificationChannel> channels;

    /**
     * 알림 제목
     */
    private String title;

    /**
     * 알림 내용
     */
    private String content;

    /**
     * 관련 엔티티 타입
     */
    private String entityType;

    /**
     * 관련 엔티티 ID
     */
    private UUID entityId;

    /**
     * 추가 메타데이터
     */
    private Map<String, Object> metadata;
}
