package com.kohub.domain.notification.repository;

import com.kohub.domain.notification.entity.Notification;
import com.kohub.domain.notification.entity.NotificationChannel;
import com.kohub.domain.notification.entity.NotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    /**
     * 사용자별 알림 목록 (최신순)
     */
    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId, Pageable pageable);

    /**
     * 사용자별 읽지 않은 알림
     */
    List<Notification> findByRecipientIdAndStatusOrderByCreatedAtDesc(UUID recipientId, NotificationStatus status);

    /**
     * 사용자별 읽지 않은 알림 개수
     */
    long countByRecipientIdAndStatus(UUID recipientId, NotificationStatus status);

    /**
     * 전송 대기 중인 알림 (채널별)
     */
    List<Notification> findByStatusAndChannelOrderByCreatedAtAsc(NotificationStatus status, NotificationChannel channel);

    /**
     * 재시도 가능한 실패 알림
     */
    @Query("SELECT n FROM Notification n WHERE n.status = 'FAILED' AND n.retryCount < 3 ORDER BY n.createdAt ASC")
    List<Notification> findRetryableNotifications();

    /**
     * 사용자별 채널 알림
     */
    Page<Notification> findByRecipientIdAndChannelOrderByCreatedAtDesc(UUID recipientId, NotificationChannel channel, Pageable pageable);
}
