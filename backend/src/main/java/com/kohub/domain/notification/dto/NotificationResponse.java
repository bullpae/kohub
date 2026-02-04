package com.kohub.domain.notification.dto;

import com.kohub.domain.notification.entity.Notification;
import com.kohub.domain.notification.entity.NotificationChannel;
import com.kohub.domain.notification.entity.NotificationStatus;
import com.kohub.domain.notification.entity.NotificationType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@Builder
public class NotificationResponse {

    private UUID id;
    private NotificationType type;
    private NotificationChannel channel;
    private NotificationStatus status;
    private String title;
    private String content;
    private String entityType;
    private UUID entityId;
    private Map<String, Object> metadata;
    private LocalDateTime createdAt;
    private LocalDateTime sentAt;
    private LocalDateTime readAt;

    public static NotificationResponse from(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .channel(notification.getChannel())
                .status(notification.getStatus())
                .title(notification.getTitle())
                .content(notification.getContent())
                .entityType(notification.getEntityType())
                .entityId(notification.getEntityId())
                .metadata(notification.getMetadata())
                .createdAt(notification.getCreatedAt())
                .sentAt(notification.getSentAt())
                .readAt(notification.getReadAt())
                .build();
    }

    /**
     * 요약 정보
     */
    @Getter
    @Builder
    public static class Summary {
        private UUID id;
        private NotificationType type;
        private String title;
        private NotificationStatus status;
        private LocalDateTime createdAt;

        public static Summary from(Notification notification) {
            return Summary.builder()
                    .id(notification.getId())
                    .type(notification.getType())
                    .title(notification.getTitle())
                    .status(notification.getStatus())
                    .createdAt(notification.getCreatedAt())
                    .build();
        }
    }
}
