package com.kohub.domain.notification.repository;

import com.kohub.domain.notification.entity.NotificationChannel;
import com.kohub.domain.notification.entity.NotificationSetting;
import com.kohub.domain.notification.entity.NotificationType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationSettingRepository extends JpaRepository<NotificationSetting, UUID> {

    /**
     * 사용자별 모든 알림 설정
     */
    List<NotificationSetting> findByUserId(UUID userId);

    /**
     * 특정 알림 설정 조회
     */
    Optional<NotificationSetting> findByUserIdAndNotificationTypeAndChannel(
            UUID userId, NotificationType type, NotificationChannel channel);

    /**
     * 특정 알림 유형에 대해 활성화된 사용자 목록
     */
    List<NotificationSetting> findByNotificationTypeAndChannelAndEnabledTrue(
            NotificationType type, NotificationChannel channel);
}
