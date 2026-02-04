package com.kohub.domain.notification.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * 사용자별 알림 설정
 */
@Entity
@Table(name = "notification_settings", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "notification_type", "channel"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@Builder
public class NotificationSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * 사용자 ID
     */
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /**
     * 알림 유형
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 30)
    private NotificationType notificationType;

    /**
     * 알림 채널
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationChannel channel;

    /**
     * 활성화 여부
     */
    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 활성화/비활성화 토글
     */
    public void toggle() {
        this.enabled = !this.enabled;
        this.updatedAt = LocalDateTime.now();
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
        this.updatedAt = LocalDateTime.now();
    }
}
