package com.kohub.domain.notification.sender;

import com.kohub.domain.notification.entity.Notification;
import com.kohub.domain.notification.entity.NotificationChannel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 인앱 알림 발송자 (DB 저장만 수행)
 */
@Component
@Slf4j
public class InAppNotificationSender implements NotificationSender {

    @Override
    public NotificationChannel getChannel() {
        return NotificationChannel.IN_APP;
    }

    @Override
    public boolean send(Notification notification) {
        // 인앱 알림은 이미 DB에 저장되어 있으므로 성공으로 처리
        log.debug("인앱 알림 저장 완료: {}", notification.getId());
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true; // 항상 활성화
    }
}
