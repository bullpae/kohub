package com.kohub.domain.notification.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * 알림 엔티티
 */
@Entity
@Table(name = "notifications")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * 수신자 ID (User)
     */
    @Column(name = "recipient_id")
    private UUID recipientId;

    /**
     * 알림 유형
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    /**
     * 알림 채널
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationChannel channel;

    /**
     * 알림 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private NotificationStatus status = NotificationStatus.PENDING;

    /**
     * 알림 제목
     */
    @Column(nullable = false)
    private String title;

    /**
     * 알림 내용
     */
    @Column(columnDefinition = "TEXT")
    private String content;

    /**
     * 관련 엔티티 타입 (ticket, host 등)
     */
    @Column(name = "entity_type", length = 30)
    private String entityType;

    /**
     * 관련 엔티티 ID
     */
    @Column(name = "entity_id")
    private UUID entityId;

    /**
     * 추가 데이터 (JSON)
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    /**
     * 전송 시도 횟수
     */
    @Column(name = "retry_count")
    @Builder.Default
    private int retryCount = 0;

    /**
     * 에러 메시지
     */
    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    /**
     * 전송 성공 처리
     */
    public void markAsSent() {
        this.status = NotificationStatus.SENT;
        this.sentAt = LocalDateTime.now();
        this.errorMessage = null;
    }

    /**
     * 전송 실패 처리
     */
    public void markAsFailed(String errorMessage) {
        this.status = NotificationStatus.FAILED;
        this.errorMessage = errorMessage;
        this.retryCount++;
    }

    /**
     * 읽음 처리
     */
    public void markAsRead() {
        if (this.status == NotificationStatus.SENT) {
            this.status = NotificationStatus.READ;
            this.readAt = LocalDateTime.now();
        }
    }

    /**
     * 재시도 가능 여부
     */
    public boolean canRetry() {
        return this.status == NotificationStatus.FAILED && this.retryCount < 3;
    }
}
