package com.kohub.domain.notification.service;

import com.kohub.domain.notification.dto.NotificationRequest;
import com.kohub.domain.notification.dto.NotificationResponse;
import com.kohub.domain.notification.entity.*;
import com.kohub.domain.notification.repository.NotificationRepository;
import com.kohub.domain.notification.repository.NotificationSettingRepository;
import com.kohub.domain.notification.sender.NotificationSender;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 알림 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationSettingRepository settingRepository;
    private final Map<NotificationChannel, NotificationSender> senders;

    /**
     * 알림 생성 및 발송
     */
    @Async
    public void sendNotification(NotificationRequest request) {
        log.info("알림 생성 시작: type={}, recipients={}", request.getType(), request.getRecipientIds().size());

        for (UUID recipientId : request.getRecipientIds()) {
            for (NotificationChannel channel : request.getChannels()) {
                // 사용자 설정 확인
                if (!isNotificationEnabled(recipientId, request.getType(), channel)) {
                    log.debug("알림 비활성화: userId={}, type={}, channel={}", recipientId, request.getType(), channel);
                    continue;
                }

                // 알림 생성
                Notification notification = Notification.builder()
                        .recipientId(recipientId)
                        .type(request.getType())
                        .channel(channel)
                        .title(request.getTitle())
                        .content(request.getContent())
                        .entityType(request.getEntityType())
                        .entityId(request.getEntityId())
                        .metadata(request.getMetadata())
                        .build();

                notification = notificationRepository.save(notification);

                // 발송
                sendViaChannel(notification);
            }
        }
    }

    /**
     * 채널별 알림 발송
     */
    private void sendViaChannel(Notification notification) {
        NotificationSender sender = senders.get(notification.getChannel());
        if (sender == null || !sender.isEnabled()) {
            log.debug("발송자 없음 또는 비활성화: channel={}", notification.getChannel());
            return;
        }

        try {
            boolean success = sender.send(notification);
            if (success) {
                notification.markAsSent();
            } else {
                notification.markAsFailed("발송 실패");
            }
            notificationRepository.save(notification);
        } catch (Exception e) {
            notification.markAsFailed(e.getMessage());
            notificationRepository.save(notification);
            log.error("알림 발송 오류: {}", e.getMessage(), e);
        }
    }

    /**
     * 사용자별 알림 목록
     */
    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(UUID userId, Pageable pageable) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId, pageable)
                .map(NotificationResponse::from);
    }

    /**
     * 읽지 않은 알림 개수
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByRecipientIdAndStatus(userId, NotificationStatus.SENT);
    }

    /**
     * 알림 읽음 처리
     */
    public void markAsRead(UUID notificationId) {
        notificationRepository.findById(notificationId)
                .ifPresent(notification -> {
                    notification.markAsRead();
                    notificationRepository.save(notification);
                });
    }

    /**
     * 모든 알림 읽음 처리
     */
    public void markAllAsRead(UUID userId) {
        List<Notification> unread = notificationRepository
                .findByRecipientIdAndStatusOrderByCreatedAtDesc(userId, NotificationStatus.SENT);
        unread.forEach(Notification::markAsRead);
        notificationRepository.saveAll(unread);
    }

    /**
     * 사용자 알림 설정 조회
     */
    @Transactional(readOnly = true)
    public List<NotificationSetting> getSettings(UUID userId) {
        return settingRepository.findByUserId(userId);
    }

    /**
     * 알림 설정 업데이트
     */
    public void updateSetting(UUID userId, NotificationType type, NotificationChannel channel, boolean enabled) {
        NotificationSetting setting = settingRepository
                .findByUserIdAndNotificationTypeAndChannel(userId, type, channel)
                .orElseGet(() -> NotificationSetting.builder()
                        .userId(userId)
                        .notificationType(type)
                        .channel(channel)
                        .build());

        setting.setEnabled(enabled);
        settingRepository.save(setting);
    }

    /**
     * 알림 활성화 여부 확인
     */
    private boolean isNotificationEnabled(UUID userId, NotificationType type, NotificationChannel channel) {
        return settingRepository.findByUserIdAndNotificationTypeAndChannel(userId, type, channel)
                .map(NotificationSetting::isEnabled)
                .orElse(true); // 기본값: 활성화
    }

    /**
     * 티켓 관련 알림 발송 헬퍼
     */
    public void notifyTicketCreated(UUID ticketId, String title, Set<UUID> assigneeIds) {
        sendNotification(NotificationRequest.builder()
                .recipientIds(assigneeIds)
                .type(NotificationType.TICKET_CREATED)
                .channels(Set.of(NotificationChannel.IN_APP, NotificationChannel.SLACK))
                .title("새 티켓: " + title)
                .content("새로운 티켓이 생성되었습니다.")
                .entityType("ticket")
                .entityId(ticketId)
                .build());
    }

    /**
     * 호스트 장애 알림
     */
    public void notifyHostDown(UUID hostId, String hostName, Set<UUID> operatorIds) {
        sendNotification(NotificationRequest.builder()
                .recipientIds(operatorIds)
                .type(NotificationType.HOST_DOWN)
                .channels(Set.of(NotificationChannel.IN_APP, NotificationChannel.SLACK, NotificationChannel.TEAMS))
                .title("⚠️ 호스트 장애: " + hostName)
                .content("호스트가 응답하지 않습니다. 즉시 확인이 필요합니다.")
                .entityType("host")
                .entityId(hostId)
                .metadata(Map.of("severity", "critical"))
                .build());
    }

    /**
     * 호스트 복구 알림
     */
    public void notifyHostUp(UUID hostId, String hostName, Set<UUID> operatorIds) {
        sendNotification(NotificationRequest.builder()
                .recipientIds(operatorIds)
                .type(NotificationType.HOST_UP)
                .channels(Set.of(NotificationChannel.IN_APP, NotificationChannel.SLACK))
                .title("✅ 호스트 복구: " + hostName)
                .content("호스트가 정상으로 복구되었습니다.")
                .entityType("host")
                .entityId(hostId)
                .build());
    }
}
